## Store data in maps

### Allow only one vote per address

To do so, our contract will have to remember wether someone voted or not. By "someone", I mean the STX address of the voter which can be accessed with `tx-sender`. The data structure needed here is a data map, a key-value store where the key will be the address and the value a boolean.  
Add this line right after the declaration of `nb-of-voters` (line 2):

```clarity
(define-map votes principal boolean)
```

It tells Clarity to store a new map called `votes`. the keys will be STX addresses (`principal`) and the values will be booleans.  

> :bulb: `principal` is a native Clarity type, just a like `uint` or `boolean`. It represents a wallet address or a contract address.

As a JS developer, my mental model for the vote map looks like some JSON:

```json
{
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG": true,
  "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC": true,
  //...
}
```

The next few lines will be quite theoretical. I'll give you all the informations you need to implement the check by yourself.

The function `map-insert` allows to add key-value pair in the map. It takes three arguments, the **map-name**, the **key** and the **value**.
```clarity
(map-insert votes tx-sender true)
```

We'll add it to our code later. Let's see how we can use it to check if the caller already voted. To retrieve a value in map we'll use `map-get?`. It takes two arguments: the **map-name** and the **key**.

> :bulb: Noticed the `?` in `map-get`? It's a convention meaning that the function returns an `optional` type. Which can either be `(some value)` or `none`.

To know if the caller already voted, we'll check if `map-get?` returns some value or not. The function `is-none` takes an optional value and returns true or false. Knowing that, we could use an `if` condition to check but a cleaner solution is to use `asserts!`. Let's see how to use both of them.

```clarity
;; the two functions behave exactly the same way

(define-private (ok-or-err1 (check bool))
  (if check
    (begin
      ;; do stuff...
      (ok true)
    )
    (err u1)
  )
)

(define-private (ok-or-err2 (check bool))
  (begin
    (asserts! check (err u1))
    ;; do stuff...
    (ok true)
  )
)
```

`asserts!` is cleaner for two reasons. It saves a level of indentation which is really useful when you want to perform multiple checks, you don't want nested `if`s. Secondly, it makes it extra-clear that you want to throw an error if the condition is false.

> :bulb: `asserts!` ends with an `!`. It's again a convention to signal that a function may throw an error.

### Exercise time

Alright let's put this knowledge into practice. Now that you know about maps, `is-none` and `asserts!`, you may be able to check if the caller already voted. So that, if someone **call the vote function twice, we can throw an error**. Don't forget to add the `map-insert` as well.

Give it a try and look at the clues if you are stuck.

<details>
<summary>Clue 1: `map-insert` and `tx-sender`</summary>

So we want to insert the address of the caller in the `votes` map. We know that the address is stored in `tx-sender`. For now the value will simply be `true`.

```clarity
(map-insert votes tx-sender true)
```
</details>

<details>
<summary>Clue 2: `is-none` and `map-get?`</summary>

We've seen that we could retrieve a value in a map with `map-get?`. In order to allow someone to call the `vote` function, we can check that the value returned by `map-get?` is equal to none.

```clarity
(is-none (map-get? votes tx-sender))
```

It will return `true` or `false`.
</details>

<details>
<summary>Clue 3: `assert!`</summary>

The function `assert!` take two arguments: a boolean and an error. It does nothing if the boolean if true, otherwise it throws the error. So we can pass our previous `(is-none ...)```

```clarity
(asserts! (is-none (map-get? votes tx-sender)) (err u403))
```

The error is just an error code. I arbitrarily used `u403` because in HTTP it means "Forbidden". We'll talk more about error later.
</details>

To test your code, call the vote function several time with the `clarinet console`.
```clarity
(contract-call? .color-vote vote) ;; should return (ok true)
(contract-call? .color-vote vote) ;; should return (err 403)
```

<details>
<summary><b>Solution</b></summary>

Here is what you code should look like at the end of this article. If you didn't, you can now look at the clues to get more in depth explication.

```clarity
(define-data-var nb-of-voters uint u0)
(define-map votes principal bool)

(define-public (vote)
  (begin
    (asserts! (is-none (map-get? votes tx-sender)) (err u403))

    (map-insert votes tx-sender true)
    (ok (var-set nb-of-voters (+ (var-get nb-of-voters) u1)))
  )
)

(define-read-only (get-nb-of-voters) (var-get nb-of-voters))
```
</details>

### Conclusion

You just learned the basics of the map data structures. We've seen `define-map`, `map-insert` and `map-get?`, soon we will also use similare functions to update and delete data in maps.  
We've also seen how validate input data `asserts!`, we'll dot that a lot in the future. Error handling will be very important.  
In the next article we'll implement the actual vote mechanism with a new data structure (lists) and our first private function.

> 💻 **Read the code on GitHub**. The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-2).  
> There is a [PR associated with this article](https://github.com/hugocaillard/clarity-voting-tuto/pull/2).
