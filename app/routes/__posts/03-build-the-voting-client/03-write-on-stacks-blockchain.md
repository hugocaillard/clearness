---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

At this stage, the web app can read data by calling read-only functions. The next step is to write data through public functions. In this article, we'll create the voting form and send the voters' choices to the contract `vote` function.

Here is what we are building in this article:

<img alt="Vote Form UI Screenshot" src="/images/vote-colors-ui.png" title="Vote Form Screenshot" width="645" height="500" />

### Call the Smart Contract in JS / TS

Remember our `readOnlyRequest` abstraction in `data/stacks.js`? We'll create a similar one to call public functions that write data.  
Since the TS and JS versions are quite the same, here is directly the TS version.

#### ./src/data/stacks.ts

```ts
// add this imports
import type { ClarityValue } from 'micro-stacks/clarity'
import {
  makeContractCallToken,
  openTransactionPopup,
} from 'micro-stacks/connect'
// ...
// app details is required for the popup
import { useAuth, appDetails } from '../stores/useAuth'

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

As you can see, `makeContractCallToken` is quite similar to `callReadOnlyFunction`. It takes mostly the same arguments. You also have to add `appDetails` that will be displayed in the transaction popup. It also takes a private key retrieved in the user session. In a future article, we will explore more complex calls with arguments and post-conditions (useful for transactions validation).

`makeContractCallToken` won't perform any action on its own. It will generate a token – as the name suggests – that can be passed to `openTransactionPopup`.

> :bulb: The token is a [JWT](https://jwt.io/). it's a way to encode JSON data into a string and sign it with a secret key. Have a look at this [package](https://www.npmjs.com/package/jsonwebtoken) if you want to know more about it.

We will now go back to the `useColorVote` store and make use of this new function. The basic implementation will be super simple. I'll also provide a more complete one with better typing.

To handle the sender's vote values, we'll add a `vote` [Map](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Map) to store the value of each color. Maps are simple key-value stores and the key can be anything. In our case, it will be the IDs of the vote options (which are BigInts).

#### ./src/storesuseColorVote.ts

```ts
import { cvToTrueValue, uintCV } from 'micro-stacks/clarity'

const ids = [0n, 1n, 2n, 3n] as const
const getInitialVote = () => new Map(ids.map((id) => [id, undefined]))

export const useColorVote = create<ColorStore>((set, get) => ({
  vote: getInitialVote(),
  // ...
  async sendVote() {
    const { vote } = get()
    const senderVote = ids.map((id) => vote.get(id))

    // the array of numbers is converted into an array of clarity values
    await callContract('vote', senderVote.map(uintCV))
  },
}))
```

> :bulb: uintCV converts a number into an unsigned integer Clarity Values
> `uintCV(42)` => `{ type: 1, value: 42n }`

<details>
<summary>TypeScript and safer version</summary>

The big difference here is the `isValueValid` method and the strict typing of a valid vote value.

#### ./src/storesuseColorVote.ts

```ts
import { cvToTrueValue, uintCV } from 'micro-stacks/clarity'

import { callContract, readOnlyRequest } from '../data/stacks'
// ...

type ValidValue = 0 | 1 | 2 | 3 | 4 | 5
type Vote = undefined | ValidValue

interface ColorStore {
  colors: Color[]
  vote: Map<BigInt, Vote>
  updateVote: (id: bigint, vote: number) => void
  fetchColors: () => Promise<void>
  sendVote: () => Promise<void>
}

const ids = [0n, 1n, 2n, 3n] as const
const getInitialVote = () => new Map(ids.map((id) => [id, undefined]))

function isValueValid(value: unknown): value is ValidValue {
  if (value === undefined || isNaN(Number(value))) return false
  return Number(value) >= 0 && Number(value) <= 5
}

export const useColorVote = create<ColorStore>((set, get) => ({
  // ...
  vote: getInitialVote(),

  async sendVote() {
    const { vote } = get()
    const senderVote = ids.map((id) => vote.get(id))
    if (!senderVote.every(isValueValid)) return

    await callContract('vote', senderVote.map(uintCV))
  },
}))
```
</details>

One last method is needed in this store to update the vote values. I named it `updateVote`, it takes two arguments, the color ID and the value of the vote.
The method makes sure that the value is between 0 and 5 and then updates the votes map.

#### ./src/storesuseColorVote.ts

```ts
export const useColorVote = create<ColorStore>((set, get) => ({
  // ...
  updateVote(id, inputValue) {
    const value = inputValue > 5 ? 5 : inputValue < 0 ? 0 : inputValue

    // Map.protype.set returns
    set((state) => ({ vote: state.vote.set(id, value) }))
  },
}))
```

> :point_right: In the TS version you also need to call `isValueValid` function to ensure type safety (or use `as Vote`).

At this stage, you can check the [`useColorVote.ts`](https://github.com/hugocaillard/color-webapp-tuto/blob/step-3/src/storesuseColorVote.ts) file on the repo if you want to see the `sendVote` and `updateVote`.

The vote store is now complete and ready to write data on the blockchain.

### Build the UI and the form

For completeness, let's take some time to see how to create the voting form. To keep things clean I made a [`VoteInput` component](https://github.com/hugocaillard/color-webapp-tuto/blob/step-3/src/components/UI/VoteInput.tsx) that you can build or get on GitHub.
Open `Vote.tsx` and import the `VoteInput` in it as well as the `Button` component.

#### ./src/pages/Vote.tsx
```ts
// <imports>

export const Vote = () => {
  const { colors, vote, updateVote, sendVote } = useColorVote()

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
              value={vote.get(c.id)}
              onInput={(e) => updateVote(c.id, e.currentTarget.valueAsNumber)}
            />
          </div>
        ))}
      </div>
      <Button type="submit">Vote</Button>
    </form>
  ) : null
}
```

The vote input directly calls `updateVote`, while the form calls an intermediary function on submit that calls `sendVote`. To improve the form, we could add a reset button, only make the submit button active if the vote is valid, add a loading state, and other things that you can come up with.  
You can see these improvements on the GitHub repo. Some UI improvements would be more than welcome as well.

### Display the transaction status

If a person casts a vote and immediately refreshes the page, they won't see that they already vote. It's because transactions can take a few minutes. Hopefully, we can retrieve the transaction and get its status, which can be success, in progress or failed.

Each transaction has a unique ID, which is returned by the `contractCall` function. We will update the `sendVote` function to save the `txId` in the local storage to retrieve it on page refresh.

#### ./src/pages/Vote.tsx
```ts
import { fetchTransaction } from 'micro-stacks/api'
// you'll need to export `network` from stacks.ts and import here
import { callContract, network, readOnlyRequest } from '../data/stacks'

export const useColorVote = create((set, get) => ({
  colors: null,
  txId: localStorage.getItem('txId'),
  lastTx: null,

  // ...

  async sendVote() {
    const { vote } = get()
    const senderVote = ids.map((id) => vote.get(id))

    const txId = await callContract('vote', senderVote.map(uintCV))

    // save the txId in `sendVote`
    localStorage.setItem('txId', txId)
    set({ txId })
  },

  async fetchLastTx() {
    const { txId } = get()
    if (!txId) return

    const tx = await fetchTransaction({
      url: network.getCoreApiUrl(),
      txid: txId,
    })
    set({ lastTx: tx })
  },
}))
```
<details>
<summary>Again, here the full  TS version with error handling</summary>

You'll need to install the `@stacks/stacks-blockchain-api-types` package because `micro-stacks` does not expose some types at the moment.

#### ./src/pages/Vote.tsx
```ts
import { fetchTransaction } from 'micro-stacks/api'
import type {
  ContractCallTransaction,
  MempoolContractCallTransaction,
} from '@stacks/stacks-blockchain-api-types'

import { callContract, network, readOnlyRequest } from '../data/stacks'
// ...

type VoteTx = ContractCallTransaction | MempoolContractCallTransaction

interface ColorStore {
  // ...
  txId: string | null
  lastTx: VoteTx | null
  fetchLastTx: () => Promise<void>
}
//...
export const useColorVote = create<ColorStore>((set, get) => ({
  txId: localStorage.getItem('txId'),
  lastTx: null,
  // ...
  async sendVote() {
    const { vote } = get()
    const senderVote = ids.map((id) => vote.get(id))
    if (!senderVote.every(isValueValid)) return

    const txId = await callContract('vote', senderVote.map(uintCV))
    localStorage.setItem('txId', txId)
    set({ txId })
  },

  async fetchLastTx() {
    const { txId } = get()
    if (!txId) return

    try {
      const tx = (await fetchTransaction({
        url: network.getCoreApiUrl(),
        txid: txId,
      })) as VoteTx | { error: string }
      if ('error' in tx) throw new Error('tx error')
      set({ lastTx: tx })
    } catch (err) {
      set({ txId: null })
      localStorage.removeItem('txId')
    }
  },
}))

```
</details>

Some useful data can be retrieved in the transactions (or "tx"). Especially the status and the arguments.  
Create a file `LastVote.tsx` in `componenents`. We'll call `fetchLastTx` inside a `useEffect` to retrieve the transaction and some relevant informations. You can add this components at this end of the `Vote.tsx` page.

#### ./src/components/LastVot.tsx
```ts
import { useEffect } from 'preact/hooks'

import { useColorVote } from '../stores/useColorVote'
import { H2 } from './UI/Typography'

export function LastVote() {
  const { txId, lastTx, fetchLastTx } = useColorVote()
  useEffect(() => {
    fetchLastTx()
  }, [txId])

  return lastTx ? (
    <div>
      <H2>Previous vote</H2>
      <p>
        <b>Status</b>: <span className="capitalize">{lastTx.tx_status}</span>
      </p>
      <ul className="flex gap-3">
        {lastTx.contract_call.function_args?.map((v) => (
          <li>
            <span className="font-bold capitalize">{v.name}</span>:{' '}
            {v.repr.replace('u', '')}
          </li>
        ))}
      </ul>
    </div>
  ) : null
}
```

### Conclusion

You now know how to **call read-only/public functions** on the Stacks blockchain and to fetch transactions data, which already opens a lot of possibilities.  
We've also seen how to pass an array of arguments when making a call. Don't forget to transform the JS values into Clarity values.  

In the next article, we'll bring some last improvements such as retrieving a vote and canceling or updating it. There will be nothing new but a good opportunity to review what you learned.

> 💻 **Read the code on GitHub**. The source code of this article is on [this branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-3).
> There is a [PR associated with this article](https://github.com/hugocaillard/color-webapp-tuto/pull/3).
