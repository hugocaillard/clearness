---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

At this stage, the web app can read data by calling read-only functions. The next step is to write data through public functions. In this article, will create the voting form and send the voters choices to the contract `vote` function.

Here is what we are building in this article:

![Vote Form Screenshot](/images/vote-colors-ui.png "Vote Form UI Screenshot")

### Call the Smart Contract in JS / TS

Remember our `readOnlyRequest` abstraction in `data/stacks.js`? We'll create a similare one to call public functions that write data.  
Since the TS and JS versions are quite the same, here is directly the TS version.

#### ./src/data/stacks.ts
```ts
// add this imports
import type { ClarityValue } from 'micro-stacks/clarity'
import { makeContractCallToken, openTransactionPopup } from 'micro-stacks/connect'
// ...
// app details is required for the popup
import { useAuth, appDetails } from '../hooks/useAuth'

export async function callContract(name: string, args: ClarityValue[] = []) {
  const key = useAuth.getState().session?.appPrivateKey
  const address = useAuth.getState().session?.addresses.testnet
  if (!key || !address) return Promise.reject(new Error())

  const token = await makeContractCallToken({
    appDetails,
    network,
    contractAddress: ADDRESS,
    contractName: CONTRACT,
    functionName: name,
    functionArgs: args,
    privateKey: key,
    stxAddress: address,
  })

  return new Promise<string>((resolve, reject) =>
    openTransactionPopup({
      token,
      onFinish: (payload) => resolve(payload.txId),
    }),
  )
}
```

As you can see, `makeContractCallToken` is quite similar to `callReadOnlyFunction`. It takes mostly the same arguments. You also have to add `appDetails`, just like `authenticate`. It also takes a private key retrieved in the user session. In a futur article, we will explore more complex calls with arguments and post-conditions (useful for transactions validation).

`makeContractCallToken` won't perform any action on it's own. It will generate a token – as the name suggest – that can be passed to `openTransactionPopup`.

> :bulb: The token is a [JWT](https://jwt.io/). it's a way to encode JSON data into a string and sign it with a secret key. Have a look at this [package](https://www.npmjs.com/package/jsonwebtoken) if you want to know more about it.

We will now go back to the `useColorVote` store and make use of this new function. The basic implementation will be super simple. I'll also provide a more complete one with better typing.

To handle the sender's vote values, a `vote` property will be added on the four colors. If you remember correctly the previous article, we shuffled the colors. It means that we now have to put it back in the right order to build ou vote array. Our sort function will need to handle BigInts, there is actually and example on [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#comparisons).

#### ./src/hooks/useColorVote.ts
```ts
import { cvToTrueValue, uintCV } from 'micro-stacks/clarity'

// ...
function sortColors({ id: a }, { id: b }) {
  return a < b ? -1 : a > b ? 1 : 0
}

export const useColorVote = create<ColorStore>((set, get) => ({
  // ...
  async sendVote() {
    // the .sort() method mutates the array, create a new one to avoid issues
    const votes = [...get().colors].sort(sortColors).map((c) => c.vote)

    // we need to convert the array of numbers into an array of clarity values
    await callContract('vote', votes.map(uintCV))
  },
}))
```

> :bulb: uintCV converts a number into an unsigned integer Clarity Values  
> `uintCV(42)` => `{ type: 1, value: 42n }`

<details>
<summary>TypeScript and safer version</summary>

The big difference here is the `isVoteValid` method and the strict typing of what is considered a valid vote.

#### ./src/hooks/useColorVote.ts
```ts
import { cvToTrueValue, uintCV } from 'micro-stacks/clarity'

type ValidVote = 0 | 1 | 2 | 3 | 4 | 5
type Vote = undefined | ValidVote

export interface Color {
  id: bigint
  value: string
  score: bigint
  vote: Vote
}

interface ColorStore {
  colors: Color[]
  fetchColors: () => Promise<void>
  sendVote: () => Promise<void>
}

function sortColors({ id: a }: Color, { id: b }: Color) {
  return a < b ? -1 : a > b ? 1 : 0
}

function isVoteValid(vote: number | undefined): vote is ValidVote {
  if (vote === undefined || isNaN(vote)) return false
  return vote >= 0 && vote <= 5
}

//...

export const useColorVote = create<ColorStore>((set, get) => ({
  // ...
  async sendVote() {
    const votes = [...get().colors].sort(sortColors).map((c) => c.vote)
    if (!votes.every(isVoteValid)) return

    await callContract('vote', votes.map(uintCV))
  },
}))

```
</details>

One last method is needed in this store to update the vote values. I named it `updateVote`, it takes two arguments, the color ID and the value of the vote.  
The method makes sure that the value is between 0 and 5, and then find the color to update.

#### ./src/hooks/useColorVote.ts
```ts
export const useColorVote = create<ColorStore>((set, get) => ({
  // ...
  updateVote(id, value) {
    const vote = value > 5 ? 5 : value < 0 ? 0 : value

    set((state) => ({
      colors: state.colors.map((c) => (c.id !== id ? c : { ...c, vote })),
    }))
  },
}))
```

In the TS version you also need to call `isVoteValid` function to ensure type safety (or use `as Vote`).  
At this stage, you can check that [`useColorVote.ts`](https://github.com/hugocaillard/color-webapp-tuto/blob/step-3/src/hooks/useColorVote.ts) file on the repo if you want to see the `sendVote` and `updateVote` methods all together.

The vote store is now complete and ready to write data on the blockchain.

### Build the UI and the form

For completness, let's take some time to see how to create the voting form. Even though it's not the main focus of this tuto. To keep things clean I made a [`VoteInput` component](https://github.com/hugocaillard/color-webapp-tuto/blob/step-3/src/components/UI/VoteInput.tsx) that you can build or get on GitHub.

Open the `Vote.tsx` file and import the `VoteInput` in it as well as the `Button` component.


```ts
// <imports>

export const Vote = () => {
  const { colors, updateVote, sendVote } = useColorVote()

  const handleSubmit = (e) => {
    e.preventDefault()
    sendVote()
  }

  return colors ? (
    <form onSubmit={handleSubmit}>
      <div className="flex">
        {colors.map((c) => (
          <div key={c.id} className="w-full">
            <Circle hex={c.value} />
            <VoteInput
              id={c.id.toString()}
              value={c.vote}
              onInput={(e) => updateVote(c.id, parseInt(e.currentTarget.value))}
            />
          </div>
        ))}
      </div>
      <Button type="submit">Vote</Button>
    </form>
  ) : null
}
```

The vote input directly call `updateVote`, while the form call and intermediary function that call send vote. To improve the form, we could add a reset button and only make the submit button active if the vote is valid.  
Some UI improvements would be more than welcome as well.

### Conclusion
