---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

## Write your first Clarity Smart Contract

{/*
Goal of the article:
- Explain what is a smart contract
- Explain what "on-chain" means
- Write the first part of the contract
  - Create the clarity project with `clarinet new`
  - Create the contract with `clarinet contract new`
  - Kickstart the contract, vote structure, add a vote and get it
*/}

### What are Smart Contracts?

Smart Contracts can be seen as the back-end code of our application. They are used to handle some logic and store on-chain data.
"On-chain" means that the data will be stored on the Stacks Blockchain. It will act as a Database.

### The Project

In this series of article, we'll develop a voting system in which the participants will vote for their favorite colors. There will be 4 choices of colors. In order to vote, the voters will rate each color from 0 (bad) to 5 (excellent). The winning color is the one with the best average grade.  
:point_right: This voting mechanism is know as the [majority judgment](https://en.wikipedia.org/wiki/Majority_judgment). It has multiple benefits. The main advantage here is to allow to define a single winner in one round of votes.

### Create the project

We'll use [Clarinet](https://github.com/hirosystems/clarinet) to manage our project. Take a look the [this article](/00-annexes/01-setting-up-env) to know more about setting up your environment.
Open your terminal and type the following commands:

```bash
$ clarinet new color-vote
$ cd color-vote
$ clarinet contract new color-vote
$ code . # optional, open the project in VS Code
```

Open the file "contracts/color-vote.clar". It might contains some boilerplate comments. You may remove those.

### Save the number of voters

In order to compute the average grade of each color, we'll have to know the total number of voters.
We will define a top level variable to store this value. While we're at it, add a read-only function to expose `nb-of-voters`.

```clarity
(define-data-var nb-of-voters uint u0)

(define-read-only (get-nb-of-voters) (var-get nb-of-voters))
```

`nb-of-voters` is an "unsigned integer": a positive integer. It's initialized at 0 and written `u0`, the `u` means... "unsigned".

At this point, you can run `$ clarinet console` in your terminal. It will open the clarity REPL and load the contract in it. It works because our contract is declared in the `Clarinet.toml` file at the root of our project. `clarinet contract new` did that for us.

To test our contract, run the following command in the REPL:

```clarity
(contract-call? .color-vote get-nb-of-voters)
```
It should print `u0`, the value of the `nb-of-voters` variable.

Define a public "vote" function that will simply increment the number of voters every time it's called. Add it at the end of the file.

```clarity
(define-public (vote)
  (begin
    ;; the vote logic will be added later
    (ok (var-set nb-of-voters (+ (var-get nb-of-voters) u1)))
  )
)
```

:point_right: You may have noted that the function `get-nb-of-voters` was defined with **`define-read-only`** whereas `vote` was defined with **`define-public`**.  
Both `read-only` and `public` are actually publics. The difference is that `read-only` function won't write data on the blockchain. It's super important because when a `public` function is called, the person doing it will have to pay some fees to run it. Whereas read-only functions are free to run.

:point_right: Unlike read-only functions, public functions **must** return a **response type** (an `ok` or `error` response). That's why we wrap the response in `(ok ...)`.

:point_right: We used `(begin ...)` inside our the function. It's actually optional here but it's needed to wrap multiple instructions in a function. It will be the case later in our `vote` function.

Let's put our code to the test. In your terminal, kill the REPL if it's still running (with `ctrl + c` or `cmd + c`). Launch it again with `clarinet console`, it will load the updated contract. Run the following commands one by one:

```clarity
(contract-call? .color-vote get-nb-of-voters)
(contract-call? .color-vote vote)
(contract-call? .color-vote get-nb-of-voters)
```

The commands should respectively print `u0`, `(ok true)` and `u1`. It means that our contract is running as expected. Currently `vote` can be called many times and it'll keep incrementing the value `get-nb-of-voters`.

### Conclusion

This first article is quite short; we are just getting started. We still learned quite a few things;
- How to use `clarinet` to **bootstrap** our contract and **test** it with the console,
- The difference between **`public` and `read-only` functions**,
- How to define, get and set **variables**.

In the next article, we'll see how to authorize only one vote per user.

> 💻 All along this tutorial, the code wil be available on GitHub. [Here is the repository](https://github.com/hugocaillard/clarity-voting-tuto).
> The code of this article is on [this branch](https://github.com/hugocaillard/clarity-voting-tuto/tree/step-1).


<details>
<summary>At the end of this article, your code should look like that</summary>

```clarity
(define-data-var nb-of-voters uint u0)

(define-public (vote)
  (begin
    (ok (var-set nb-of-voters (+ (var-get nb-of-voters) u1)))
  )
)

(define-read-only (get-nb-of-voters) (var-get nb-of-voters))
```
</details>
