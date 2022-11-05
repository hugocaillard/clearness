---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
links:
---

To improve the readability of Clarity code (or any code), it's important to be consistent in the way it's written. It's necessary to have some good rules, but whatever the rules are, it's even more important to follow them.
Here are some opinionated rules followed in the snippets of this website. Even if Clarity is based on Lisp, some rules are inspired by JS. Since we code in both languages, I just think it makes it easier to jump between.

:point_right: **It's up to you to follow or not these rules in your code. Again, the important thing is to be consistent.**

### Line length

In order to ease the readability of the code, limit to 80 characters per line:

```clarity
❌
(define-read-only (get-squared-values (numbers (list 10 int))) (map square numbers))

✅
(define-read-only (get-squared-values (numbers (list 10 int)))
  (map square numbers)
)
```

### One line function

It's ok to write functions on one line when they are short. It's also ok to write them on multiple lines if you find it more consistent.

```clarity
✅
(define-constant MAX_VALUE u5)
(define-private (is-valid (value uint)) (<= v MAX_VALUE))
```

```clarity
✅
(define-constant MAX_VALUE u5)
(define-private (is-valid (value uint))
  (<= v MAX_VALUE)
)
```

### Parenthesis indentation and line-breaks

The closing parenthesis should be at the same indentation level as the opening one.

```clarity
❌
(define-read-only (concat-2-words
  (first-word (string-utf8 10))
  (second-word (string-utf8 10)))
  (concat (concat first-word u" ") second-word))

✅
(define-read-only (concat-2-words
  (first-word (string-utf8 10))
  (second-word (string-utf8 10))
)
  (concat (concat first-word u" ") second-word)
)
```

Since Clarity has only `()` (and no `{}` or `[]`), both of the above syntaxes can make it hard to read. I prefer the second one. Maybe your favorite editor has some features to enable brackets pair colorations. I use the following settings in VSCode:
```json
"[clarity]": {
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active"
}
```

### Naming case

Naming stuff is complicated enough, having some rules can make it a bit easier.
Basically, in lisp-like languages, everything is "_kebab-case_" (which is also called "_lisp-case_"). Two other rules can make one's life a bit easier:
- name constants with "*SCREAMING_SNAKE_CASE*" to make them easily identifiable,
- name tuple keys with "_camelCase_", especially when they are meant to be used in JS/TS on the client-side.

```clarity
❌
(define-constant err-not-found (err u404))
(ok (merge { id: id, min-price: (var-get min-price) } item))

✅
(define-constant ERR_NOT_FOUND (err u404))
(define-data-var min-price uint u100)

(define-read-only (get-item (id uint))
  (let ((item (unwrap! (map-get? items id) ERR_NOT_FOUND)))
    (ok (merge { id: id, minPrice: (var-get min-price) } item))
  )
)
```

### Going further

Check the ["Coding Style" chapter](https://book.clarity-lang.org/ch14-01-coding-style.html) in the Clarity book for more best practices tips.
