---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

## Get the elected color

At the end of the previous article, we had a working voting Smart Contract. We'll soon be able to start working on the front-end application to interact with the contract. Participants should be able to:
1. ❌ get the candidates
1. ✅ vote for each candidate
1. ❌ get the winner

Currently, we can only do 2. Let's focus on 1 and 3.

### Get the colors candidates

In the third article, we created a constant `COLORS` to store 4 colors but you may have noticed that we didn't use it. The reason it exists is that we want our contract to be the only source of truth and to leave no place for interpretation.

The read-only function `get-colors` allows to get the four colors along with their current and their id. We could hard code the tuple but if we had more vote options (like 10 or 20 colors) it would quickly become hard to manage. So we'll `map` over a hard-coded list of ids `(list u0 u1 u2 u3)` and call `get-color` that returns a tuple for a single color.

```clarity
(define-read-only (get-color (id uint))
  (ok {
    id: id,
    value: (unwrap! (element-at COLORS id) ERR_NOT_FOUND),
    score: (unwrap! (element-at (var-get scores) id) ERR_NOT_FOUND),
  })
)

(define-read-only (get-colors) (map get-color (list u0 u1 u2 u3)))

;; add the not found error constant at the end of the file
(define-constant ERR_NOT_FOUND (err u404))
```

> :bulb: `get-color` could also be a private function. I made it public in case a use case for it emerges in the future.

> :point_right:`(element-at <list> <index>)` returns the item of a list at a given index. It can also return `none`. Remember that indexes start at 0.
> ```clarity
> (element-at (list "Hello" "World" u"!") u1) ;; (some "World")
> ```

I hope you paid attention to the previous article. It's now time to test these two functions.
Here is a first test to make sure that `get-colors` returns the right color:

```ts
// imports `assertEquals` at the beginnign of the file
import { assertEquals } from 'https://deno.land/std@0.126.0/testing/asserts.ts'
// get ascii from types
const { uint, ascii } = types

//...

Clarinet.test({
  name: '`get-color` - returns the right color',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-color', [uint(1)], address),
    ])

    // expectTuple will transform the clarity value into a JS object
    const color = receipts[0].result.expectOk().expectTuple()
    // assertEquals will compare our two objecs
    assertEquals(color, {score: uint(0), id: uint(1), value: ascii('D1C0A8') })
  },
})
```

<details>
<summary>Other versions of the test without `assertEquals`</summary>

```ts
// I named the type `CV` for `Clarity Value`
// we expect an object where every value is a string
// { id: "u1", score: "u0", value: '"D1C0A8"' }
type CVColor = {
  id: string
  score: string
  value: string
}

Clarinet.test({
  name: '`get-color` - returns the right color',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-color', [uint(1)], address),
    ])

    // `as CVColor` is not the cleanest way to do it but it's good enough
    const color = receipts[0].result.expectOk().expectTuple() as CVColor
    color.id.expectUint(1)
    color.score.expectUint(0)
    color.value.expectAscii('D1C0A8')
  },
})
```
</details>

The test above shows you how to use `exepectTuple` and check that the returned object is valid. Your turn to write three more tests:
- check that `(get-color u6)` (with an invalid id) returns a 404 error
- check that `(get-colors)` returns the list of colors. You'll have to use `expectList().
- now that we can fetch the colors, we can test that `vote` does save the data :+1:

<details>
<summary>Done already? Alright let's have a look at a possible way to do it</summary>

```ts
Clarinet.test({
  name: '`get-color` - returns 404 for invalid id',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-color', [uint(10)], address),
    ])

    receipts[0].result.expectErr().expectUint(404)
  },
})

Clarinet.test({
  name: '`get-colors` - returns the array of colors',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'get-colors', [], address),
    ])

    const colors = receipts[0].result.expectList()

    const expectedColors = ['F97316', 'D1C0A8', '2563EB', '65A30D']
    colors.forEach((colorTuple, i) => {
      const color = colorTuple.expectOk().expectTuple() as CVColor
      color.id.expectUint(i)
      color.value.expectAscii(expectedColors[i])
    })
  },
})

Clarinet.test({
  name: '`vote` - sets the vote values',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [5, 4, 3, 2].map(uint), address),
      Tx.contractCall('color-vote', 'get-color', [uint(0)], address),
    ])

    receipts[0].result.expectOk()
    const color = receipts[1].result.expectOk().expectTuple() as CVColor
    color.score.expectUint(5)
  },
})
```
</details>


### Get the winner

The "winner" is the color with the highest score. However, it may not be that simple. We want our contract to explicitly give it. Indeed, we could add more rules (eg: a minimum score or number of voters) and we need the contract to be the **source of truth**. Again, our contract should leave no place for interpretation.

In the previous section, I gave you the Clarity code and you had to write the tests. You may know that [TDD (Test Driven Development)](https://en.wikipedia.org/wiki/Test-driven_development) is a thing. The developers write the tests first and after, the code to pass these tests. We'll kind of do it here. Except that you don't have to write the test, I'll do it for you:


```ts
type CVElected = {
  id: string
  score: string
}

Clarinet.test({
  name: '`get-elected` - returns elected',
  // settings "only" is handy when you want to focus on a specific test
  // we'll remove it at the end
  only: true,
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      Tx.contractCall('color-vote', 'vote', [0, 4, 0, 0].map(uint), address),
      Tx.contractCall('color-vote', 'get-elected', [], address),
    ])

    receipts[0].result.expectOk().expectBool(true)

    // the result can be `none` or `(some ...)` so we use `expectSome()`
    const elected = receipts[1].result.expectSome().expectTuple() as CVElected
    elected.id.expectUint(1)
    elected.score.expectUint(4)
  },
})
```

> :bulb: For the sake of this tutorial, we simply test a case where the winner is well defined. We won't handle edge cases like two colos having the exact same score. Feel free to add it as a personal exercise but we won't go through this right now.

You can add this code to your test suite (`color-vote_test.ts`), run `$ clarinet test --watch` and update your contract to make the test green :white_check_mark:

> :point_right: You'll have to use `(get <key-name> <tuple>)` to extract the value in a tuple.
>```clarity
> (get score { score: u0 } ;; u0
>```

:fire: Things are getting serious here. This is **not** an easy exercise, I'll recommend you to give it a try and dedicate some time to it. Look at the hints below in case you are stuck. Don't be discouraged if you have to look at the solution. The important point is that you try.


<details>
<summary>Hint 1</summary>

Similarly to `get-colors`, we'll want to iterate on the color IDs, but we only want to return one of the colors. Or none. So we won't use `map` to iterate on the colors but `fold`. As always, have a look at the ["Iterate on lists" articles](/00-annexes/04-iterate-on-lists#fold) if you need to check how `fold` works.

Let's write the `get-elected` function that will call `find-best` on each id thanks to `fold`.  
This initial value of fold will be `none`.

```clarity
(define-read-only (get-elected) (fold find-best (list u0 u1 u2 u3) none))
```

Now your job is to write the `find-best` function.
</details>

<details>
<summary>Hint 2</summary>

The `find-best` function accepts two arguments.  
The first one will be passed each `id` of our list. It's named `next` as in "next ID to check".  
The second argument will be, for each iteration, the color with the current best score. It's initialized with `none` so to make our type consistent, it has to be optional.

Here is the signature of the function:

```clarity
(define-private (find-best
  (next uint)
  (current (optional { id: uint, score: uint }))
)
  ;; ...
)
```

Let's complete the function so that it returns `(some { id: uint, score: uint })`
</details>

Have a look at the solution even if you're not done, as long as you did your best to try :muscle:

<details>
<summary>Solution and explanations</summary>

The solution only takes a few lines but these lines are quite intense! Look at it and read the explanations below.

```clarity
(define-private (find-best
  (next uint)
  (current (optional { id: uint, score: uint }))
)
  (let ((next-score (unwrap-panic (element-at (var-get scores) next))))
    (if (> next-score (default-to u0 (get score current)))
      (some { id: next, score: next-score })
      current
    )
  )
)

(define-read-only (get-elected) (fold find-best (list u0 u1 u2 u3) none))
```

- Read the two hints above to know more about the scaffolding of `get-elected` and `find-best`
- `let` allows us to store the `next-score` in a local variable
  - `(element-at (var-get scores) next)` gives the score of each id at each iteration
  - Since `element-at` can return `none`, we habe to `unwrap` the result. It's ok to use `unwrap-panic` because we are in a controlled private function that we only call with known ids.
- `if` handle our conditions, we want the `next-score` to be strictly greater than the current one
  - We use `(default-to u0 (get score current))` since `current` can be `none`
  - If the condition is true, we return `(some { id: next, score: next-score })`, meaning that the "next" color replaces the current one. `some` is needed since `current` can also be `none`
  - If the condition is false, the current winner stays the current winner so we return it
</details>

If you haven't yet, run `$ clarinet test` just to make sure that your tests are ok. Good job for reaching the end of this article :muscle:

### Conclusion

We completed our to-do list :tada: and as a bonus point: everything is tested!
1. ✅ get the candidates
1. ✅ vote for each candidate
1. ✅ get the winner

The article was quite intense. I hope it wasn't too difficult. `fold` can be hard to understand at the beginning but at some point, it clicks and starts making sense. I encourage you to modify the code to really understand it. We'll come back to it at some point to add more winning conditions.

The next article will go off without a hitch compared to this one. Two functions will be added to allow participant to edit or delete their vote.

A break is well deserved for now :tea: :coffee: :glass_of_milk:

> 💻 **Read the code on GitHub**. The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-5).  
> There is a [PR associated with this article](https://github.com/hugocaillard/clarity-voting-tuto/pull/5).
