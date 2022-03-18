---
headers:
  Cache-Control: public, immutable, max-age=180, s-maxage=2592000
---

# From JS to Clarity

## Functions

```js
function add(a, b) {
  return a + b
}

add(1, 2)
```

```clarity
(define-private (add (a int) (b int))
  (+ a b)
)

(add 1 2)
```
