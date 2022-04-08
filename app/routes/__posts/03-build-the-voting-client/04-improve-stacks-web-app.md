---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

There will be fundamentally nothing new in this article. Take it as an exercise to practice and review what you previously learned.

### Add a bit of Clarity

I hope you didn't forget how to write Clarity code. Go back to the smart contract and add a function called `get-sender-vote`. This function will tell if the sender already voted and the values of its vote.  
It's a one-line read-only function that returns `none` or `(some [<value>])`. Even though it's simple, I encourage you to write it yourself since you often need to tweak a contract while building its client app.

Don't forget to add [tests](https://github.com/hugocaillard/clarity-voting-tuto/blob/72bb87d96e8fbd01c093a8d66a5f1367e06eba40/tests/color-vote_test.ts#L285-L303) for this new function.

<details>
<summary>💡 `get-sender-vote` function</summary>

#### ./contracts/color-vote.clar
```clarity
(define-read-only (get-sender-vote) (map-get? votes tx-sender))
```
</details>


### Get the sender's vote

That's it for the Clarity part. You can go back to that web app code and we will now make use of this new function. In the color vote store, add a function `fetchVote()` that will call `get-sender-vote`. If there is a vote, save it in the `vote` property.  
The trick here is to handle the [BigInt values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) that will be returned by the contract. Our store expects Numbers and we want to keep it that way to easily set the values of the vote inputs. BigInts can easily be converted into Numbers with `parseInt`.

Again, try and implement it by yourself as an exercise.

In my implementation, I [changed](https://github.com/hugocaillard/color-webapp-tuto/pull/4/files#diff-c1b28751be28e0da46326d585afa2a643cb5502a35203fbe19b5a3f448311b67R42-R43) the `getInitialVote` function into `getVoteMap` which accepts optional values to return in the map instead of `undefined` values.

<details>
<summary>Solution: `fetchVote`</summary>

#### ./src/stores/useColorVote.ts
```ts
const getVoteMap = (values) =>
  new Map(ids.map((id, i) => [id, values ? values[i] : undefined]))

export const useColorVote = create<ColorStore>((set, get) => ({
  vote: getVoteMap(),
  alreadyVoted: false,
  // ...

  async fetchVote() {
    const rawVote = await readOnlyRequest('get-sender-vote')

    const vote = cvToTrueValue(rawVote).map((v) => parseInt(v))
    set({ vote: getVoteMap(voteAsNbs), alreadyVoted: true })
  },
```
</details>

<details>
<summary>Typesafe version of `fetchVote`</summary>

#### ./src/stores/useColorVote.ts
```ts
type ValidVote = [ValidValue, ValidValue, ValidValue, ValidValue]

function isPreviousVoteValid(vote: unknown): vote is ValidVote {
  if (!Array.isArray(vote) || vote.length !== 4) return false
  return vote.reduce((acc, v) => isValueValid(v) && acc, true)
}

export const useColorVote = create<ColorStore>((set, get) => ({
  // ...

  async fetchVote() {
    const rawVote = await readOnlyRequest('get-sender-vote')
    if (!rawVote) return

    const vote = cvToTrueValue(rawVote)
    if (!vote || !Array.isArray(vote)) return

    const voteAsNbs = vote.map((v) => parseInt(v))
    if (!isPreviousVoteValid(voteAsNbs)) return
    set({ vote: getVoteMap(voteAsNbs), alreadyVoted: true })
  },
```
</details>

### Call `fetchVote`

This new function will be called the same way as `fetchColors`, as early as possible in `App.tsx`.

#### ./src/App.tsx
```tsx
export function App() {
  const { session } = useAuth()

  useEffect(() => {
    if (session) {
      const { fetchVote, fetchColors } = useColorVote.getState()
      fetchVote()
      fetchColors()
    }
  }, [session])
  // ...
```

### Update or cancel a vote

Our app is now aware of whether the person already voted or not. This information is useful to know if `revote` should be called instead of `vote` or if `unvote` can be called.

> :point_right: **Exercise**: edit `useColorVote` to:
> - Call `revote` in `sendVote` if the user already voted
> - Add an `unvote` function

Note that in all cases (vote, revote and unvote), you want to save the tx ID so that you can display the status of the last transaction.


<details>
<summary>💡 `sendVote` and `unvote` functions</summary>

#### ./src/stores/useColorVote.ts
```ts
  // since we now have two functions that save that tx id
  // I put it in its own function
  saveTx(txId: string) {
    localStorage.setItem('txId', txId)
    set({ txId })
  },

  async sendVote() {
    const { vote, alreadyVoted, saveTx } = get()
    const senderVote = ids.map((id) => vote.get(id))
    if (!senderVote.every(isValueValid)) return

    // update the contract call function
    const txId = await callContract(
      alreadyVoted ? 'revote' : 'vote',
      senderVote.map(uintCV),
    )
    saveTx(txId)
  },

  async unvote() {
    const { alreadyVoted, saveTx } = get()
    if (!alreadyVoted) return

    const txId = await callContract('unvote')
    set({ vote: getVoteMap() })
    saveTx(txId)
  },
```
</details>

> :bulb: As always, you may want to have a look at the [file on GitHub](https://github.com/hugocaillard/color-webapp-tuto/blob/step-4/src/stores/useColorVote.ts#L107-L123) to easily follow along.

We can update the form's buttons to take into account the changes in the store.

#### ./src/pages/Vote.tsx
```tsx
  const handleUnvote: JSX.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    unvote()
  }

  return (
    // ...
            <div class="mt-6 flex justify-center gap-4">
              {/* display "Revote" if the user already voted */}
              <Button type="submit" disabled={!isValid}>
                {alreadyVoted ? 'Revote' : 'Vote'}
              </Button>

              <Button type="reset">Empty form</Button>

              {/* Allow use to cancel its vote */}
              {alreadyVoted ? (
                <Button type="button" onClick={handleUnvote}>
                  Cancel vote
                </Button>
              ) : null}
            </div>
```

In the `lastVote` component, I also added a line to display the function name of the last contract call since it can now have 3 different values.
#### ./src/components/LastVote.tsx
```tsx
      <p>
        <b>Function</b>:{' '}
        <span className="capitalize">{lastTx.contract_call.function_name}</span>
      </p>
```

Further improvements ideas:
- Once the user voted, display the results of the election.
- The result pages could be implemented with simple routing.
- If the last tx is pending, fetch it every X seconds to know when it's successful (or if it failed). You don't want to call it too frequently because the API can be overloaded from time to time.
- Feel free to get in touch with me on [GitHub](https://github.com/hugocaillard/color-webapp-tuto), [Twitter](https://twitter.com/cohars), or the [Stacks Discord](https://community.stacks.org/groups) to propose other ideas to add to this list.


You may see these improvements in the latest version of the code on the GitHub repo but I won't cover them in articles.

### Conclusion

Here is the end of the first part of this series.  
You now master the basics of Clarity and Web3 on Stacks. You can create valuable Smart Contracts and build front-end applications to interact with them.

In the next articles, we will learn concepts such as transferring Stacks on the blockchain and manipulating NFTs. These are keys concepts of Web3 and things will get serious!  
We will also go through other important concepts such as deploying smart contracts to the Stacks blockchain.

> 💻 **Read the code on GitHub**. The source code of this article is on [this branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-4).
> There is a [PR associated with this article](https://github.com/hugocaillard/color-webapp-tuto/pull/4).
