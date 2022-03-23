---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

## Iterate on Clarity lists

The [Clarity language reference](https://github.com/clarity-lang/reference/blob/5cffb641762ee49ef7b2bde624a4abc3fe55d5f4/reference.md) specifies a list of "limitations". The second one is:

> _"Looping may only be performed via map, filter, or fold"_

This means that there's no such thing as `for` or `while` loops in Clarity. The only way to iterate is to use the built-in functions `map`, `filter`, and `fold`.  
If you come from the JS/TS world for instance, these functions might feel familiar since they are the equal of `[].map()`, `[].filter()` and `[].reduce()`.

### An overview of `map`, `filter`, and `fold` (with food emojis :yum:)

There's a great [tweet by @stevluscher](https://twitter.com/steveluscher/status/741089564329054208) that explains the equivalent JS functions. Let's see how it would look like in Clarity. (This is just pseudo-code, we won't write the actual functions.)

```clarity
(map cook (list "🌽" "🌾" "🥔"))
;; => (list "🍿" "🍞" "🍟")

(filter isCooked (list "🍿" "🌾" "🍟"))
;; => (list "🍿" "🍟")

(fold makeBurger (list "🥬" "🥩" "🧀" "🍅") "🍞")
;; => "🍔"
```

What do we learn with these examples?  
- :point_right: A list of 3 items is passed to `map` and it returns a new **list** of the same length with modified items.  
- :point_right: A similar list is given to `filter`, it returns a smaller **list** with some of the items of the original list.  
- :point_right: A list and an emoji are passed to `fold`, it returns an **emoji** (not a list) built with all the items.

Finally, they all take a function as their first argument (`cook`, `isCooked` & `makeBurger`). The second argument is a **sequence (list, buffer, or string)**. `fold` takes a third argument, we'll talk more about it later.

We will focus on each of these functions.

---
## map

The `map` function takes at least 2 arguments. The first one is a function that will be called for each element of the provided sequences. It also takes one or many sequences (1..N) of the same type.
It always returns a list. 

Take a look at two examples from the [official doc](https://docs.stacks.co/references/language-functions#map):
```clarity
;; 1st
(map not (list true false true false)) ;; returns (false true false true)
;; 2nd
(map + (list 1 2 3) (list 1 2 3) (list 1 2 3)) ;; returns (3 6 9)
```

The first example is very basic, `map` will apply the `not` function on each boolean of the provided list. So that in the result `true` becomes `false` and _vice-versa_.  
The second example shows that many sequences can be given. It will apply the `+` function to each corresponding item  (`(+ 1 1 1) ;; => 3`...). It works because `(+)` can take more than 2 arguments.

Time to put it to practice!

### Exercise 1:
Write a `square` function so that `(map square <list>)` returns the squared value of each number (uint) of the list.
```clarity
;; add your square function here

(print (map square (list u1 u2 u3 u4)))
;; => (list u1 u4 u9 u16)
```

> :computer: [Open in ClarityTools][ct-1]

<details>
<summary>Hint</summary>

For this exercise, you'll have to define a `private-function`.  
Note that we'll only manipulate unsigned integers (`uints`).
</details>

<details>
<summary>Solution exercise 1</summary>

```clarity
(define-private (square (n uint))
  (* n n)
)
;; or using pow: (define-private (square (n uint)) (pow n u2))

(print (map square (list u1 u2 u3 u4)))
;; => (list u1 u4 u9 u16)
```
</details>

### Exercise 2:
Define a data-map matching IDs (uint) to Pseudos (string-utf8). Write a public function `get-10-pseudos` that takes a list of up to 10 IDs and returns the matching 10 pseudos.

:point_right: Note that the `map` function is **not** the same thing as a `data-map`. The latter is a data structure used to store data within a Clarity smart contract.

```clarity
(define-map pseudos uint (string-utf8 100))
(map-insert pseudos u0 u"muneeb")
(map-insert pseudos u1 u"satoshi")
(map-insert pseudos u2 u"aulnau")
(map-insert pseudos u4 u"akirtovskis")

;; insert your code here

(print (get-10-pseudos (list u0 u3 u4)))
;; (list (some u"muneeb") none (some u"akirtovskis"))
```

> :computer: [Open in ClarityTools][ct-2]

<details>
<summary>Hint</summary>

The function `get-10-pseudos` will call the function `map`. Therefore, you'll have to declare a private function `get-1-pseudo` that will be called for each provided ID.

```clarity
(define-map pseudos uint (string-utf8 100))
(map-insert pseudos u0 u"muneeb")
(map-insert pseudos u1 u"satoshi")
(map-insert pseudos u2 u"aulnau")
(map-insert pseudos u4 u"akirtovskis")

(define-private (get-1-pseudo (id uint))
  ;; this function might need some changes
)

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  ;; use map to call get-1-pseudo for each id
)

(print (get-10-pseudos (list u0 u3 u4)))
;; (list (some u"muneeb") none (some u"akirtovskis"))
```
</details>

<details>
<summary>Solution exercise 2</summary>

```clarity
(define-map pseudos uint (string-utf8 100))
(map-insert pseudos u0 u"muneeb")
(map-insert pseudos u1 u"satoshi")
(map-insert pseudos u2 u"aulnau")
(map-insert pseudos u4 u"akirtovskis")

(define-private (get-1-pseudo (id uint))
  (map-get? pseudos id)
)

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  (map get-1-pseudo ids)
)

(print (get-10-pseudos (list u0 u3 u4)))
;; (list (some u"muneeb") none (some u"akirtovskis"))
```
</details>

---
## filter
The `filter` function takes exactly 2 arguments. The first one is the test function and the second one is a sequence. `filter` will return a sequence of the same type as the second argument.  
Each item of the input sequence will be passed to the test function, if it returns `true` the item is added to the output sequence.

Here is a nice example from the [official doc](https://docs.stacks.co/references/language-functions#filter):
```clarity
(define-private (is-a (char (string-utf8 1))) (is-eq char u"a"))
(filter is-a u"acabd") ;; Returns u"aa"
```

It's pretty much self-explaining, it's also a nice example to show that if the second argument is a string, the output is of the same type.
Here is another example from the doc:

```clarity
(filter not (list true false true false false)) 
;;                     -----      ----- -----
;; returns (list false false false)
```
The native `not` function returns the inverse of the input. So every time `filter` passes the `false` value to it, it will return `true` and thus, add the item (ie: `false`) to the output list.

It's exercise time again :smile:

### Exercise 3:
Write a function called `is-even` so that `(filter is-even <list>)` returns the list of even numbers from the `<list>`.
```clarity
;; add is-even function here

(print (filter is-even (list u1 u2 u10 u51 u42)))
;; => (list u2 u10 u42)
```

> :computer: [Open in ClarityTools][ct-3]

<details>
<summary>Hint</summary>

To know if a number is even, you can check if the integer remainder from dividing by 2 is equal to zero. Clarity has a built-in function `(mod i1 i2)` to compute this value.
</details>

<details>
<summary>Solution exercise 3</summary>

```clarity
(define-private (is-even (n uint)) (is-eq (mod n u2) u0))

(print (filter is-even (list u1 u2 u10 u51 u42)))
;; => (list u2 u10 u42)
```
</details>

### Exercise 4:
Looking back at Exercise 2, the output of the `get-10-pseudos` could be improved. When we left it, it returned an **optional utf8 string** (`(some u"string")` or `none`). What if we wanted it to return only the pseudos, along with the matching id.

:point_right: This exercise is a bit more complicated than the previous ones. if it seems too complicated, feel free to jump to the `fold` section and come back to it later.

```clarity
(define-map pseudos uint (string-utf8 100))
(map-insert pseudos u0 u"muneeb")
(map-insert pseudos u1 u"satoshi")
(map-insert pseudos u2 u"aulnau")
(map-insert pseudos u4 u"akirtovskis")

(define-private (get-1-pseudo (id uint))
  ;; you probably want to modifiy this part
)

;; add other private functions here

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  ;; you will need a combination of map and filter to make it work
)

(print (get-10-pseudos (list u0 u3 u4)))
;; > (list {id: u0, pseudo: "muneeb"} {id: u4, pseudo: "akirtovskis"})
```

:point_right: It's not possible to pass some native function to `map`, `filter` and `fold` (such as `is-some` or `unwrap-panic` for instance). They must be wrapped into another function with less generic type signatures.

> :computer: [Open in ClarityTools][ct-4]

<details>
<summary>Hint 1</summary>

The problem can be split in three steps:
1. **map** the ids to their equivalent value: `(some { id: uint, pseudo: (string-utf8 100) })`. The value is wrapped into `(some)` because sometime it will be `none` and the function has to return the same type (an optional tuple in this case),
1. **filter** the items to keep only the `some` ones,
1. **map** again on the list in order to unwrap the `(some <tuple>)` into simply `<tuple>`.
</details>

<details>
<summary>Hint 2</summary>

In the end, `get-10-pseudos` will be a chain of map and filter:
```clarity
(define-read-only (get-10-pseudos (ids (list 10 uint)))
  (map unwrap-pseudo (filter is-some-pseudo (map get-1-pseudo ids)))
)
```
It's now your job to write down the `get-1-pseudo`, `is-some-pseudo` and `unwrap-pseudo` function.
</details>

<details>
<summary>Solution exercise 4</summary>

```clarity
(define-map pseudos uint (string-ascii 100))
(map-insert pseudos u0 "muneeb")
(map-insert pseudos u1 "satoshi")
(map-insert pseudos u2 "aulnau")
(map-insert pseudos u4 "akirtovskis")

(define-private (get-1-pseudo (id uint))
  (some { id: id, pseudo: (unwrap! (map-get? pseudos id) none) })
)

(define-private (unwrap-pseudo
  (item (optional { id: uint, pseudo: (string-ascii 100) }))
)
  (unwrap-panic item)
)

(define-private (is-some-pseudo
  (item (optional { id: uint, pseudo: (string-ascii 100) }))
)
  (is-some item)
)

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  (map unwrap-pseudo (filter is-some-pseudo (map get-1-pseudo ids)))
)
```
:point_right: It's usually recommended to use `unwrap!` in order to throw better errors. We can consider that `unwrap-panic` is ok here because we call it **after** `is-some`
:point_right: In the real world, we would probably let the client take 
</details>

---
## fold

Fold is a bit different than `map` and `filter`. It takes exactly 3 arguments, a function, a sequence, and the initial value.
The 1st argument, the function will be called recursively with each item and the previous result. A classic example is to compute the sum of the numbers in a list. `(fold + (list 4 5 6) 0)`. It will call the `+` function 3 times (or each item in the list):
- `(+ 4 0) ;; = 4` (0 is the initial value)
- `(+ 5 4) ;; = 9` (4 is the precedent result)
- `(+ 6 9) ;; = 15` (9 is the precedent result)

As a quick warm-up, try achieving the same thing but with your own function for `sum`. So that `(fold sum (list 4 5 6) 0)` returns 15.  
Also, write a `sub` function so that `(fold sub (list 4 5 6) 0)` returns 5. With the `sub` function, the order of the arguments matters.
<details>
<summary>Here are the solutions. Really give it a try before looking at it.</summary>

```clarity
(define-private (sum (a int) (b int)) (+ a b))
(define-private (sub (a int) (b int)) (- a b))
```
</details>

### Exercise 5

In this exercise, we'll try and write a read-only function to find the biggest number in a list of 10 uint.
```clarity 
(define-private (find-biggest (numbers (list 10 uint)))
  ;; find the biggest number in numbers
)

(find-biggest (list u2 u12 u3 u4 u5 u9 u2 u10 u0 u2)) ;; u12
```

> :computer: [Open in ClarityTools][ct-5]

<details>
<summary>Hint</summary>

A hint is probably not needed here, it's quite similar to the previous exercises. You will have to write a private function, call it `return-biggest`, that will return the biggest of two numbers. Pass it to `fold` that will compare all of the items of the list versus the previous biggest.
</details>

<details>
<summary>Solution exercise 5</summary>

```clarity
(define-private (return-biggest (number uint) (result uint))
  (if (> number result) number result)
)

(define-private (find-biggest (numbers (list 10 uint)))
  (fold return-biggest numbers u0)
)
```
</details>


### Exercise 6

Remember [exercise 4](#exercise-4)? We defined 3 private functions that were called with `map`, `filter`, and `map` again. It was pretty heavy to write but mostly, it was heavy to run! Indeed, resources are very important (in programming in general but even more when working on-chain). With the previous solutions, our code iterated three times on the list. For a list of 10 items, it would mean 30 calls to the private functions. What if we could use fold to replace the 3 iterations with only one?

```clarity
(define-map pseudos uint (string-ascii 100))
(map-insert pseudos u0 "muneeb")
(map-insert pseudos u1 "satoshi")
(map-insert pseudos u2 "aulnau")
(map-insert pseudos u4 "akirtovskis")

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  ;; (fold ...)
)
```

> :computer: [Open in ClarityTools][ct-5]

<details>
<summary>Hint 1</summary>

The first difficulty here could be to know what should be the initial value of the result? it's just an empty list. So the function would look like that
```clarity
(define-read-only (get-10-pseudos (ids (list 10 uint)))
  (fold fold-pseudos ids (list))
)
```
It's your job to write `fold-pseudos` now.
</details>

<details>
<summary>Hint 2</summary>

We previously used `unwrap-panic` but mentioned that it wasn't ideal. Here, you'll be able to easily replace it with `unwrap!` and return the result in case of error.
</details>

<details>
<summary>Solution exercise 6</summary>

```clarity
(define-map pseudos uint (string-ascii 100))
(map-insert pseudos u0 "muneeb")
(map-insert pseudos u1 "satoshi")
(map-insert pseudos u2 "aulnau")
(map-insert pseudos u4 "akirtovskis")

(define-private (fold-pseudos
  (id uint)
  (acc (list 10 { id: uint, pseudo: (string-ascii 100) }))
)
  (let ((pseudo (unwrap! (map-get? pseudos id) acc)))
    (unwrap! (as-max-len? (append acc { id: id, pseudo: pseudo }) u10) acc)
  )
)

(define-read-only (get-10-pseudos (ids (list 10 uint)))
  (fold fold-pseudos ids (list))
)
```

:point_right: The second argument of the folding is often called `acc`, as in "accumulator" since it accumulates the result of each iteration. It can also be called "result" or something more meaningful in a given context.
</details>

---

## Conclusion

Congrats for making it to the end of the article. I hope you learned a thing or two and that you are ready to master `map`, `filter` and, `fold`.  
Remember the emojis at the beginning? It's important to recognize when to use which function. Need to transform all items of a list? **Use `map`**. Need to remove items from a list? **Use `filter`**. Need to condense a list into something else? **`fold`** to the rescue!

<details>
<summary>One more exercise?</summary>

Complete the `is-sorted` function to check if the numbers in the input list are ordered from lowest to greatest.
No clues, no solution for this one. Keep it simple and efficient :smile:

```clarity
(define-read-only (is-sorted (numbers (list 10 uint)))
  ;; ...
)

(print (is-sorted (list u1 u2 u3 u4))) ;; true
(print (is-sorted (list u1 u2 u2 u3))) ;; true
(print (is-sorted (list u1 u5 u3 u4))) ;; false
```
</details>


---
## Useful links

Official references: [map](https://docs.stacks.co/references/language-functions#map), [filter](https://docs.stacks.co/references/language-functions#filter), and [fold](https://docs.stacks.co/references/language-functions#fold).

[ct-1]: https://clarity.tools/code?OzsgYWRkIHlvdXIgc3F1YXJlIGZ1bmN0aW9uIGhlcmU6CgoobWFwIHNxdWFyZSAobGlzdCB1MSB1MiB1MyB1NCkpIDs7ID0+IChsaXN0IHUxIHU0IHU5IHUxNikKCjs7IG5leHQgbGluZSBzaG91bGQgYmUgdHJ1ZQoocHJpbnQgKGlzLWVxIChtYXAgc3F1YXJlIChsaXN0IHUxIHUyIHUzIHU0KSkgKGxpc3QgdTEgdTQgdTkgdTE2KSkp
[ct-2]: https://clarity.tools/code?KGRlZmluZS1tYXAgcHNldWRvcyB1aW50IChzdHJpbmctdXRmOCAxMDApKQoobWFwLWluc2VydCBwc2V1ZG9zIHUwIHUibXVuZWViIikKKG1hcC1pbnNlcnQgcHNldWRvcyB1MSB1InNhdG9zaGkiKQoobWFwLWluc2VydCBwc2V1ZG9zIHUyIHUiYXVsbmF1IikKKG1hcC1pbnNlcnQgcHNldWRvcyB1NCB1ImFraXJ0b3Zza2lzIikKCjs7IHRoaXMgZnVuY3Rpb24gbWlnaHQgbmVlZCBzb21lIGNoYW5nZXMKKGRlZmluZS1wcml2YXRlIChnZXQtMS1wc2V1ZG8gKGlkIHVpbnQpKSkgOzsgLi4uCgooZGVmaW5lLXJlYWQtb25seSAoZ2V0LTEwLXBzZXVkb3MgKGlkcyAobGlzdCAxMCB1aW50KSkpKSA7OyAuLi4KCjs7IG5leHQgbGluZSBzaG91bGQgYmUgdHJ1ZQooaXMtZXEgKGdldC0xMC1wc2V1ZG9zIChsaXN0IHUwIHUzIHU0KSkgKGxpc3QgKHNvbWUgdSJtdW5lZWIiKSBub25lIChzb21lIHUiYWtpcnRvdnNraXMiKSkp
[ct-3]: https://clarity.tools/code?OzsgYWRkIGlzLWV2ZW4gZnVuY3Rpb24gaGVyZQoKCihmaWx0ZXIgaXMtZXZlbiAobGlzdCB1MSB1MiB1MTAgdTUxIHU0MikpCjs7ID0+IChsaXN0IHUyIHUxMCB1NDIpCgo7OyBuZXh0LWxpbmUgc2hvdWxkIGJlIHRydWUKKGlzLWVxIChmaWx0ZXIgaXMtZXZlbiAobGlzdCB1MSB1MiB1MTAgdTUxIHU0MikpIChsaXN0IHUyIHUxMCB1NDIpKQ==
[ct-4]: https://clarity.tools/code?KGRlZmluZS1tYXAgcHNldWRvcyB1aW50IChzdHJpbmctdXRmOCAxMDApKQoobWFwLWluc2VydCBwc2V1ZG9zIHUwIHUibXVuZWViIikKKG1hcC1pbnNlcnQgcHNldWRvcyB1MSB1InNhdG9zaGkiKQoobWFwLWluc2VydCBwc2V1ZG9zIHUyIHUiYXVsbmF1IikKKG1hcC1pbnNlcnQgcHNldWRvcyB1NCB1ImFraXJ0b3Zza2lzIikKCjs7IHlvdSBwcm9iYWJseSB3YW50IHRvIG1vZGlmaXkgdGhpcyBwYXJ0CihkZWZpbmUtcHJpdmF0ZSAoZ2V0LTEtcHNldWRvIChpZCB1aW50KSkpCgo7OyBhZGQgb3RoZXIgcHJpdmF0ZSBmdW5jdGlvbnMgaGVyZQoKOzsgeW91IHdpbGwgbmVlZCBhIGNvbWJpbmF0aW9uIG9mIG1hcCBhbmQgZmlsdGVyIHRvIG1ha2UgaXQgd29yawooZGVmaW5lLXJlYWQtb25seSAoZ2V0LTEwLXBzZXVkb3MgKGlkcyAobGlzdCAxMCB1aW50KSkpKQoKKGdldC0xMC1wc2V1ZG9zIChsaXN0IHUwIHUzIHU0KSkKOzsgKGxpc3Qge2lkOiB1MCwgcHNldWRvOiAibXVuZWViIn0ge2lkOiB1NCwgcHNldWRvOiAiYWtpcnRvdnNraXMifSkKCjs7IG5leHQgbGluZSBzaG91bGQgYmUgdHJ1ZQooaXMtZXEgKGdldC0xMC1wc2V1ZG9zIChsaXN0IHUwIHUzIHU0KSkgKGxpc3QgeyBpZDogdTAsIHBzZXVkbzogIm11bmVlYiIgfSB7IGlkOiB1NCwgcHNldWRvOiAiYWtpcnRvdnNraXMiIH0pKQ==
[ct-5]: https://clarity.tools/code?OzsgZmluZCB0aGUgYmlnZ2VzdCBudW1iZXIgaW4gbnVtYmVycwogKGRlZmluZS1wcml2YXRlIChmaW5kLWJpZ2dlc3QgKG51bWJlcnMgKGxpc3QgMTAgdWludCkpKSkKCgooZmluZC1iaWdnZXN0IChsaXN0IHUyIHUxMiB1MyB1NCB1NSB1OSB1MiB1MTAgdTAgdTIpKSA7OyB1MTIKCihpcy1lcSAoZmluZC1iaWdnZXN0IChsaXN0IHUyIHUxMiB1MyB1NCkpKSA7OyB0cnVl
[ct-6]: https://clarity.tools/code?KGRlZmluZS1tYXAgcHNldWRvcyB1aW50IChzdHJpbmctYXNjaWkgMTAwKSkKKG1hcC1pbnNlcnQgcHNldWRvcyB1MCAibXVuZWViIikKKG1hcC1pbnNlcnQgcHNldWRvcyB1MSAic2F0b3NoaSIpCihtYXAtaW5zZXJ0IHBzZXVkb3MgdTIgImF1bG5hdSIpCihtYXAtaW5zZXJ0IHBzZXVkb3MgdTQgImFraXJ0b3Zza2lzIikKCihkZWZpbmUtcmVhZC1vbmx5IChnZXQtMTAtcHNldWRvcyAoaWRzIChsaXN0IDEwIHVpbnQpKSkpIDs7IC4uLgogCihnZXQtMTAtcHNldWRvcyAobGlzdCB1MCB1MyB1NCkpCjs7ID4gKGxpc3Qge2lkOiB1MCwgcHNldWRvOiAibXVuZWViIn0ge2lkOiB1NCwgcHNldWRvOiAiYWtpcnRvdnNraXMifSkKCjs7IG5leHQgbGluZSBzaG91bGQgYmUgdHJ1ZQooaXMtZXEgKGdldC0xMC1wc2V1ZG9zIChsaXN0IHUwIHUzIHU0KSkgKGxpc3Qge2lkOiB1MCwgcHNldWRvOiAibXVuZWViIn0ge2lkOiB1NCwgcHNldWRvOiAiYWtpcnRvdnNraXMifSkp
