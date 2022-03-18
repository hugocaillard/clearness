## Implement the basic voting mechanism

At this stage, we have a working Smart Contract that only counts the number of "voters" and allows only one vote per address. In this article, we'll see how to implement the actual voting system.


### Data Structure

Our vote will have **4 options**. As we've seen in the [first article](/01-voting-clarity-smart-contract/01-getting-started#the-project), thanks to "majority judgment", it would also work with more (or less) options.  
Participants will be asked to vote for their favorite colors. First, let's store a constant with the list of candidate colors (in hexadecimal).

```clarity
;; orange beige sky lime
(define-constant COLORS (list "F97316" "D1C0A8" "2563EB" "65A30D"))
```

We also want to store the score of each colors.

To understand how it will work, consider the following scenario:  
:ballot_box_with_ballot: participant "A" votes **`(u2 u2 u2 u5)`**  
:ballot_box_with_ballot: participant "B" votes **`(u4 u0 u0 u3)`**  
"A" prefers the 4th option and equally likes the 3 others. "B" prefers the 1st option hates the 2nd and 3rd and is ok with the 4th one. The number of voters would be 2 and the average scores would be:

> **`(u3 u1 u1 u4)`** We have our winner, the 4th option with a score of 4.

The scores will be stored in a list data-var. This `scores` variable will store the sum of all the votes and the average will be computed on the fly when needed. The variable will be initialized with `u0` values like so:

```clarity
(define-data-var scores (list 4 uint) (list u0 u0 u0 u0))
```

### Update the vote function

<details>
<summary>At the end of the previous article, our vote function looked like that</summary>

```clarity
(define-public (vote)
  (begin
    (asserts! (is-none (map-get? votes tx-sender)) (err u403))

    (map-insert votes tx-sender true)
    (ok (var-set nb-of-voters (+ (var-get nb-of-voters) u1)))
  )
)
```
</details>

To implement the voting mechanism, this function will be modified to accept the vote values. It will need to **accept arguments**. We could handle one argument as a list of 4 values like so:

```clarity
;; ⚠️ this is not the way we'll do it
(define-public (vote (values (list 4 uint))) ...)
```

It would be ok for a private function but since this one is public, we can try to give more sense to the arguments. Let's add one argument per color and then store it in a list:

```clarity
(define-public (vote (orange uint) (beige uint) (sky uint) (lime uint))
  (let ((values (list orange beige sky lime)))
    ;; ...
  )
)
```

It makes it super easy for participants to double-check their vote when submitting it. As you can see in the Hiro Wallet below:

![Hiro Wallet Color Vote Screenshot](/images/vote-colors.png "Vote Screenshot")

> :bulb: In the code snippet above, we replaced `(begin)` with `(let ())`. [`let`](https://docs.stacks.co/references/language-functions#let) allows to define local variables and assign them to values or expressions. Here, we assign a list to `values`, it will make it easier to use later.

This new vote can be added to the scores, it's only a matter of adding two lists of 4 items together. If you're not sure how to do it, I recommend you to refer to the ["Iterate on lists" article](/00-annexes/04-iterate-on-lists#map). Indeed, we can use `map` and `+` to sum the lists. The result is stored in the `scores` variables.

```clarity
  (var-set scores (map + (var-get scores) values))
```

Right now, I suggest you take a moment to make sure your code is working, with all the edits we made. To test you can run `$ clarinet console` and in the repl:  
`(contract-call? .color-vote vote u1 u5 u2 u3)`  
It should still return `(ok true)` if you call it one time and `(err u403)` if you call it more. If it doesn't work as expected, take a few minutes to debug it.

<details>
<summary>Here is what the contract should look like</summary>

```clarity
;; orange beige sky lime
(define-constant COLORS (list "F97316" "D1C0A8" "2563EB" "65A30D"))
(define-data-var scores (list 4 uint) (list u0 u0 u0 u0))
(define-data-var nb-of-voters uint u0)
(define-map votes principal bool)

(define-public (vote (orange uint) (beige uint) (sky uint) (lime uint))
  (let ((values (list orange beige sky lime)))
    (asserts! (is-none (map-get? votes tx-sender)) (err u403))

    (var-set scores (map + (var-get scores) values))
    (var-set nb-of-voters (+ (var-get nb-of-voters) u1))
    (ok (map-insert votes tx-sender true))
  )
)

(define-read-only (get-nb-of-voters) (var-get nb-of-voters))
```
</details>

### Validate the vote values

We want to make sure that participants give a score from 0 to 5. Since we are using unsigned integers, the values are always greater or equal than 0. We have to check that they're lower than or equal to 5. We could check each value, yet it might be cleaner to do it with a `fold`.  
Let's declare a function `is-valid` that takes a value and check if it's `<= u5` and call it with fold:

```clarity
(define-constant MAX_SCORE u5)
;; ...

(define-private (is-valid (v uint) (valid bool))
  (and valid (<= v MAX_SCORE))
)

;;...
;; within the vote function
  (asserts! (fold is-valid values true) (err u400))
```

We defined a `MAX_SCORE` constant at the beginning of the contract. It's not mandatory but it does make our contract more understandable.  
Then, the `is-valid` function will be called for each value of the vote. The `valid` argument is initialized at `true` and if a value is greater than 5, `valid` will be set to false and stay false thanks to `(and)`.  
:point_right: If you find it hard to understand, have a look at the fold section in the ["Iterate on lists" articles](/00-annexes/04-iterate-on-lists#fold).

### Better errors

This article may have been quite intense. An easy improvement can be added to make our contract easier to read. At this stage, we have meaningless errors in our code. They could be stored in meaningful constants like so:

```clarity
(define-constant ERR_BAD_REQUEST (err u400))
(define-constant ERR_FORBIDDEN (err u403))
```

Although I usually add constants at the beginning of the contract, let's add these errors at the end. Just to make the beginning of the contract nicer to read. Then, we can replace the errors in our code, they are now easy to read and to use. Here's what your contract should look like:

```clarity
;; orange beige sky lime
(define-constant COLORS (list "F97316" "D1C0A8" "2563EB" "65A30D"))
(define-constant MAX_SCORE u5)
(define-data-var scores (list 4 uint) (list u0 u0 u0 u0))
(define-data-var nb-of-voters uint u0)
(define-map votes principal bool)

(define-private (is-valid (v uint) (valid bool)) (and valid (<= v MAX_SCORE)))

(define-public (vote (orange uint) (beige uint) (sky uint) (lime uint))
  (let ((values (list orange beige sky lime)))
    (asserts! (is-none (map-get? votes tx-sender)) ERR_FORBIDDEN)
    (asserts! (fold is-valid values true) ERR_BAD_REQUEST)

    (var-set scores (map + (var-get scores) values))
    (var-set nb-of-voters (+ (var-get nb-of-voters) u1))
    (ok (map-insert votes tx-sender true))
  )
)

(define-read-only (get-nb-of-voters) (var-get nb-of-voters))

(define-constant ERR_BAD_REQUEST (err u400))
(define-constant ERR_FORBIDDEN (err u403))
```

### Conclusion

Things are starting to look great. We have a working voting system. We've only scratched the surface of what can be done with `map` and `fold`. I encourage you to take some time to understand these two functions.

In the next article, we'll see how to write unit tests for our contract.

> 💻 **Read the code on GitHub**. The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-3).  
> There is a [PR associated with this article](https://github.com/hugocaillard/clarity-voting-tuto/pull/3).
