## Update or cancel a vote

Since our election isn't limited in time, we'll give the opportunity to voters to change their mind about their vote. Let's add two more features to our Smart Contract: the ability to **remove** their vote and the ability to **edit** it.

### Store the vote of participants

Whether we want to edit or remove one's vote, we'll need to know what score they gave to each value. So that we can subtract these values from the total score.
The `vote` map can be repurposed for that. We currently store a `bool` while a `list` would be more useful. Two lines will be changed:

```clarity
(define-map votes principal (list 4 uint))
```

```clarity
;; at the end of the vote function
;; store the vote values instead of "true"
(ok (map-insert votes tx-sender values))
```

> :point_right: Run `clarinet test` just to make sure we didn't break everything.

---

### Remove a vote

We'll define a public function called `unvote`. You'll see that it's quite easy to remove a vote. At this stage, you should have more and more autonomy so I'll let you write down the tests and complete the code.

To retrieve the vote of the sender, we'll use `map-get?`. To remove its vote from the `votes` map, we'll use `map-delete`. Here is some scaffolding:

```clarity
(define-public (unvote)
  (let ((sender-vote (unwrap! (map-get? votes tx-sender) ERR_FORBIDDEN)))
    ;; ...
  )
)
```

On the tests, here is at least what we should check:

- after calling `vote` a sender can call `unvote`
- `unvote` returns an error if the sender didn't vote before
- the sender can call `vote` again after calling `unvote`
- the `nb-of-voters` is decremented when a person calls a valid `unvote`
- the `scores` are subtracted by the sender's vote values

<details>
<summary>Solution: Clarity code</summary>

Only 3 lines were missing:
1. subtract the sender's vote from the scores,
1. decrement the `nb-of-voters`,
1. delete the sender's vote from the `votes` map.

#### color-vote_test.clar
```clarity
(define-public (unvote)
  (let ((sender-vote (unwrap! (map-get? votes tx-sender) ERR_FORBIDDEN)))
    (var-set scores (map - (var-get scores) sender-vote))
    (var-set nb-of-voters (- (var-get nb-of-voters) u1))
    (ok (map-delete votes tx-sender))
  )
)
```
</details>

<details>
<summary>Solution: Tests</summary>

I did exactly one test per bullet point listed above. Indeed, each one tests only one thing. It's ok if your tests aren't the exact same, there are multiple ways of doing it.  
By the way, these tests are not very exhaustive. If I wanted to make the contract production-ready; I would test more scenarios.

#### color-vote_test.ts
```ts
Clarinet.test({
  name: '`unvote`- can be called after `vote`',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [2, 3, 4, 5].map(uint), address),
      Tx.contractCall('color-vote', 'unvote', [], address),
      Tx.contractCall('color-vote', 'get-colors', [], address),
    ])

    receipts[0].result.expectOk().expectBool(true)
    receipts[1].result.expectOk().expectBool(true)
    receipts[2].result.expectList().forEach((c) => {
      const { score } = c.expectOk().expectTuple() as CVColor
      score.expectUint(0)
    })
  },
})

Clarinet.test({
  name: '`unvote`- throws a forbidden error if the person did not vote',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'unvote', [], address),
    ])

    receipts[0].result.expectErr().expectUint(403)
  },
})

Clarinet.test({
  name: '`unvote`- allows user to `vote` again',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [0, 4, 0, 0].map(uint), address),
      Tx.contractCall('color-vote', 'unvote', [], address),
      Tx.contractCall('color-vote', 'vote', [4, 0, 0, 0].map(uint), address),
      Tx.contractCall('color-vote', 'get-elected', [], address),
    ])

    receipts[2].result.expectOk()
    const winner = receipts[3].result.expectSome().expectTuple() as CVElected
    winner.id.expectUint(0)
  },
})

Clarinet.test({
  name: '`unvote` - decrements the nb-of-votes',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [2, 3, 4, 5].map(uint), address),
      Tx.contractCall('color-vote', 'unvote', [], address),
      Tx.contractCall('color-vote', 'get-nb-of-voters', [], address),
    ])

    receipts[2].result.expectUint(0)
  },
})

Clarinet.test({
  name: '`unvote`- subtract the previous vote values from the total score',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [2, 3, 4, 5].map(uint), address),
      Tx.contractCall('color-vote', 'unvote', [], address),
      Tx.contractCall('color-vote', 'get-colors', [], address),
    ])

    receipts[2].result.expectList().forEach((c) => {
      const { score } = c.expectOk().expectTuple() as CVColor
      score.expectUint(0)
    })
  },
})
```
</details>

---

### Edit a vote and costs optimization

At this stage, a person can call `unvote` and `vote` again to change its vote. 

> :question: Is a `revote` function needed instead of calling `unvote + vote`.

It's can be costly to call public-functions. To keep efficient gas fees, a single function that combines `unvote` and `vote` will be more efficient. The following function would get the job done:

```clarity
(define-public (unvote-and-vote (orange uint) (beige uint) (sky uint) (lime uint))
  (begin
    (try! (unvote))
    (vote orange beige sky lime)
  )
)
```

> :point_right: Since `unvote` can fail, we must wrap it in `try!` so that if it fails, the function will stop and the forbidden errors will be thrown.

Thanks to this function, we saved our users some gas fees. But the function is still unnecessarily costly. The main reason is that it performs **6 write operations**:
1. remove the previous vote from `scores`,
1. set `nb-of-voters` (-1),
1. delete the sender vote from `votes`,
1. add th new vote to `scores`,
1. set `nb-of-voters` (+1),
1. insert the sender in `votes`.

Nonetheless, it's costly but it's also useless. `nb-of-voters` is written twice but its value is unchanged in the end. Clarinet has a tool to compute costs. Launch `clarinet console` and run the following commands: 

```clarity
::toggle_costs ;; display the costs of each call
(contract-call? .color-vote vote u1 u2 u3 u4)
(contract-call? .color-vote unvote-and-vote u4 u3 u2 u1)
```

#### The cost of `unvote-and-vote`:
|                      | Consumed | Limit      |
|----------------------|----------|------------|
| Runtime              | 44518    | 5000000000 |
| Read count           | 15       | 7750       |
| Read length (bytes)  | 2981     | 100000000  |
| **Write count**      | **6**    | 7750       |
| Write length (bytes) | 544      | 15000000   |

If it can be significantly optimized, we'll do it. Execution costs are important when running on a blockchain. **Write a better `revote` function that will do almost the same thing but without calling the existing functions.**

<details>
<summary>Solution: Clarity Code</summary>

```clarity
(define-public (revote (orange uint) (beige uint) (sky uint) (lime uint))
  (let (
    (values (list orange beige sky lime))
    (sender-vote (unwrap! (map-get? votes tx-sender) ERR_FORBIDDEN))
  )
    (asserts! (fold is-valid values true) ERR_BAD_REQUEST)

    (var-set scores (map + (map - (var-get scores) sender-vote) values))
    (ok (map-set votes tx-sender values))
  )
)
```
</details>

Try calling `unvote-and-vote` and `revote` in the Clarinet console and compare the costs. You'll see there is a real improvement on all metrics. `unvote-and-vote` can now be deleted.

#### The utput cost of `revote`:
|                      | Consumed | Limit      |
|----------------------|----------|------------|
| Runtime              | 32070    | 5000000000 |
| Read count           | 7        | 7750       |
| Read length (bytes)  | 2508     | 100000000  |
| **Write count**      | **2**    | 7750       |
| Write length (bytes) | 290      | 15000000   |


Did you write some tests for your `revote` function? If not, here is what should be tested:
- `revote` can be called to edit a vote,
- `revote` returns an error if the sender didn't vote before,
- the sender can call `revote` multiple times,
- the `scores` are updated.

The tests are similar to the `unvote` ones, you'll find my proposition on the [GitHub repository](https://github.com/hugocaillard/clarity-voting-tuto/pull/6).


### Conclusion

In the 2nd article, we've seen how to use `map-insert`. We are now able to edit or delete values in maps with `map-set` and `map-delete`.

The article concludes the first part of this series. Our contract is quite complete right now. The next articles will focus on developing the web app that will be used to vote and interact with our contract :raised_hands:

There will be one or two bonus articles to improve this contract. One of them will be about rewarding voters with a (fun) NFT :eyes:

> 💻 **Read the code on GitHub**. The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-6).  
> There is a [PR associated with this article](https://github.com/hugocaillard/clarity-voting-tuto/pull/6).
