---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

A lot of manual testing has been done in the previous article with the Clarinet Repl and `contract-call?`. On bigger projects, it can become painful to manually test all features. In a few minutes you will be able to implement unit tests with Clarinet.

### Clarinet test

In the first article of this series, we use `$ clarinet contract new color-vote` to create our Clarity file. You may have seen that it also created a TypeScript file: `./tests/colors-vote_tests.ts`.

> :bulb: Clarinet's test suites are based on [Deno](https://deno.land/). Just like Node, it's a runtime for JavaScript, that also supports TypeScript. That's why we'll our tests in TS files. Although it's ok if you write regular JS.

Open `colors-vote_tests.ts` and take some time to look at it, read the comments. Once cleaned a little, it looks like that:

```ts
import {
  Chain,
  Clarinet,
  Account,
  Tx,
  types,
} from 'https://deno.land/x/clarinet@v0.27.0/index.ts'

Clarinet.test({
  name: 'Ensure that <...>',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const block = chain.mineBlock([])
    // ...
  },
})
```

The method `chain.mineBlock()` will accept an array of transactions (Tx), it will fake the Stacks blockchain to run our tests.

### Write the first test

Let's test our simplest method: `get-nb-of-voters`.
First, we will call it with `Tx.contractCall()`. Thanks to TypeScript, we can have a look at this method's signature:
```ts
Tx.contractCall(contract: string, method: string, args: string[], sender: string): Tx
```

The first argument is the contract name, in our case `color-vote`. Followed by the method we want to call: `get-nb-of-voters`, which takes no arguments so args will be `[]`. Finally, `sender` is the address of the tx-sender, which we can get with the `accounts` parameter of the test function. Indeed, Clarinet will load the config from `settings/devnet.toml`, which describes a list of fake accounts.  
Putting it all together:

```ts
Clarinet.test({
  name: '`get-nb-of-voters` - returns the right number of voters',
  fn(chain: Chain, accounts: Map<string, Account>) {
    // wallet_1 is described in settings/devnet.toml.
    // The `!` tells TS that we know it exists and can't be undefined
    const { address } = accounts.get('wallet_1')!

    const block = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-nb-of-voters', [], address),
    ])

    console.log(block)
  },
})
```

You can run `$ clarinet test --watch`, it will run the tests and re-run them every time a file is updated.  
At this point we don't really test anything, we just log the result. Which you can see in your console (it contains `result: "u0"`), that's the response of our call.

To ensure that the result is `u0`, we will use Clarinet built in method like so:
```ts
// add this instead of the console.log(block)
block.receipts[0].result.expectUint(0)
```

In your console, you should see a line telling that the test is ok. Try changing the expected value like so: `expectUint(1)` and Clarinet tells that the test fails. The message should be: `Expected u1, got u0`.

### Test the `vote` function

What about a more complex function?  
`vote` takes arguments and can respond with `ok` or `error` in some conditions. Our tests should make sure that all scenarios are handled. We will send two `vote` transactions. On the first call, we should expect an `(ok true)` response. On the second one, it should be `(err u403)`. Not that we can chain `expect` methods.

```ts
Clarinet.test({
  name: '`vote` - participant can vote only one time',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!

    // `types` is imported at the top of the document
    // It converts JS values into Clarity values, here 5 will become 'u5'
    const vote = [types.uint(5), types.uint(5), types.uint(5), types.uint(5)]

    const block = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', vote, address),
      Tx.contractCall('color-vote', 'vote', vote, address),
    ])

    // check first receipt
    block.receipts[0].result.expectOk().expectBool(true)
    // check second receipt
    block.receipts[1].result.expectErr().expectUint(403)
  },
})
```

### Exercise time

Give it a try and write your own test. Make sure that `nb-of-voters` is well incremented after `vote` is called. Complete this code:

```ts
Clarinet.test({
  name: '`vote` - increments the number of voters',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    // ...
  },
})
```

> :bulb: Note that `vote` is a public function that wraps return a response so you must use `expectOk` or `expectErr` with it. Whereas `get-nb-of-voters` is a read-only function that directly returns an uint. It's not wrapped in a response.

<details>
<summary>Solution "vote increments the number of voters"</summary>

```ts
Clarinet.test({
  name: '`vote` - vote increments the number of voters',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!

    const vote = [types.uint(5), types.uint(5), types.uint(5), types.uint(5)]

    const block = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', vote, address),
      Tx.contractCall('color-vote', 'get-nb-of-voters', [], address),
    ])

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectUint(1)
  },
})
```
</details>

### One more test

I'll let you add a test checking that if a vote is invalid, `vote` does return an error. With a value is greater than 5. Take some time to write this test.

<details>
<summary>At this point, your code should look like that</summary>

I also did a bit of cleaning, especially:
```ts
// deconstruct `types` into the one we need
const { uint } = types

// same for `receipts` instead of writting `block.receipts`
const { receipts } = chain.mineBlock([/* ... */])
```
#### color-vote_test.ts
```ts
import {
  Chain,
  Clarinet,
  Account,
  Tx,
  types,
} from 'https://deno.land/x/clarinet@v0.27.0/index.ts'

const { uint } = types

Clarinet.test({
  name: '`get-nb-of-voters` - returns the right number of voters',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-nb-of-voters', [], address),
    ])

    receipts[0].result.expectUint(0)
  },
})

Clarinet.test({
  name: '`vote` - participant can vote only one time',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [5, 5, 5, 5].map(uint), address),
      Tx.contractCall('color-vote', 'vote', [5, 5, 5, 5].map(uint), address),
    ])

    receipts[0].result.expectOk().expectBool(true)
    receipts[1].result.expectErr().expectUint(403)
  },
})

Clarinet.test({
  name: '`vote` - vote increments the number of voters',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [5, 5, 5, 5].map(uint), address),
      Tx.contractCall('color-vote', 'get-nb-of-voters', [], address),
    ])

    receipts[0].result.expectOk().expectBool(true)
    receipts[1].result.expectUint(1)
  },
})

Clarinet.test({
  name: '`vote` - throw an error if the vote is not valid',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [6, 5, 5, 5].map(uint), address),
    ])

    receipts[0].result.expectErr().expectUint(400)
  },
})

```
</details>

### Conclusion

I hope you enjoyed this small break from clarity. I find it pleasant to write some TS to tests my Smart Contracts :smile:

From now on, we will write tests every time we change a behavior in our contract. I'll even show you how I like to improve tests to make them a bit easier to read. Tests are super important since contracts are immutable once deployed, you really don't want to deploy buggy code.

In the next article we'll add a few read-only functions that will allow the user to:
- fetch the candidates of the vote,
- get the winner if there's one.

You may already feel that `map` and `fold` will be useful again :slightly_smiling_face:

> 💻 **Read the code on GitHub**. The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-4).  
> There is a [PR associated with this article](https://github.com/hugocaillard/clarity-voting-tuto/pull/4).
