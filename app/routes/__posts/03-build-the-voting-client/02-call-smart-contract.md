---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

In the previous article, we worked on some mandatory steps to get started. The people visiting our web app are now able to authenticate with their Stacks Wallet. Once logged in, they will be able to call the functions exposed by our contract.

> :bulb: Make sure that your code from the previous article is working. You can pull the code from the [step-1 branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-1).

### **Read-only** VS **Public** Functions

In the very [first article](/01-voting-clarity-smart-contract/01-getting-started) of the voting smart contract series, I explained the difference between `read-only` and `public` functions. It will become more relevant now that will call the contract from our web app.

While these two types of functions are publicly exposed, they have a few fundamental differences.
- :point_right: A call to a read-only function is an HTTP request to a stacks-api endpoint. So no fees are required.
- :point_right: Calling a public function means creating a transaction that will be validated by a miner, who will be rewarded with the fees set by the caller. It requires opening a web wallet popup and waiting a few minutes for the transaction to be validated.

From a developer's point of view, it means that calling a read-only function or a public one will be different.

### Fetch Color options

The "color-vote" contract is our source of truth, it exposes the vote options that can be fetched by calling the read-only function `get-colors`.  
Create a file called `./src/data/stacks.ts` in which we will abstract calls to our contract. First, we will require some of our dependencies, declare some functions and instantiate a "network" object:

#### ./src/data/stacks.ts
```ts
import { StacksMocknet } from 'micro-stacks/network'
import { callReadOnlyFunction } from 'micro-stacks/transactions'

const network = new StacksMocknet({
  url: 'http://localhost:3999',
})

const ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
const CONTRACT = 'color-vote'
```

The `ADDRESS` stores the Stacks address on which our contract is deployed. In development, the contract was deployed by running `$ clarinet integrate`. It uses the [deployer address in the Devnet.toml file](https://github.com/hugocaillard/clarity-voting-tuto/blob/343f47fc39be15ea856f01b6e13de5cd13da3f77/settings/Devnet.toml#L9).

In the future, we will add some logic to handle calls to the testnet or the mainnet. For now, working with the devnet is enough.

> :point_up: "devnet" and "mocknet" are synonyms. It's your locally running Stacks network.
> The "mainnet" is the real Stacks network while the "testnet" is a similar one but where everything is fake.

The `callReadOnlyFunction` method is quite self-explanatory. As explained above, it will call a stacks API endpoint that will call a smart contract's read-only function. It accepts an `options` argument. Here is a description of the required options:

```ts
callReadOnlyFunction({
  contractAddress, // the address where the contract is deployed
  contractName, // the name of the contract
  functionName, // the read-only function to call
  functionArgs, // an array of arguments to pass to the read-only function
  senderAddress, // the address of the wallet making the call
  network, // the devnet, testnet, or mainnet object
})
```

Let's write a function called `readOnlyRequest` that will allow us to call read-only functions on the `color-vote` contract.

#### ./src/data/stacks.ts
```ts
// add useAuth import
import { useAuth } from '../hooks/useAuth'
// ...

export async function readOnlyRequest(name, args = []) {
  const address = useAuth.getState().session?.addresses.testnet

  const res = await callReadOnlyFunction({
    contractAddress: ADDRESS,
    contractName: CONTRACT,
    functionName: name,
    functionArgs: args,
    senderAddress: address,
    network,
  }))

  return res
}
```

> :bulb: We just used another great feature of zustand, we can call `getState` on a store hook outside of a React component. Here it allows us to get the address of the logged-in wallet.

This first implementation is quite simple, but not very secure.

<details>
<summary>Here is an extended version with **TypeScript** and error handling</summary>

#### ./src/data/stacks.ts
```ts
import { StacksMocknet } from 'micro-stacks/network'
import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { ClarityValue } from 'micro-stacks/clarity'

import { useAuth } from '../hooks/useAuth'

const network = new StacksMocknet({
  url: 'http://localhost:3999',
})

const ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
const CONTRACT = 'color-vote'

export async function readOnlyRequest<T extends ClarityValue>(
  name: string,
  args: (string | ClarityValue)[] = [],
) {
  const address = useAuth.getState().session?.addresses.testnet
  if (!address) {
    console.warn('missing address')
    return
  }

  try {
    const res = (await callReadOnlyFunction({
      contractAddress: ADDRESS,
      contractName: CONTRACT,
      functionName: name,
      functionArgs: args,
      senderAddress: address,
      network,
    })) as T

    return res
  } catch (err) {
    console.error(err)
    return null
  }
}
```
</details>

We will call this function in a new zustand store called `useColorVote.ts`. It will contain a `fetchColors` method. This function calls the `cvToTrueValue` helper. In this context: `cv` means `Clarity Value`.

Indeed, when fetching colors, the Stacks endpoint will return raw Clarity data. The `callReadOnlyFunction` will convert it into a understanble JS object but we still have to convert it into JS "true values". Here is a snippet to demonstrate this method:

```ts
async function clarityValueSnippet() {
  const rawColors = await readOnlyRequest('get-colors')
  deepEquals(rawColors, {
    type: 11,
    list: [
      {
        type: 7,
        value: {
          data: {
            id: { type: 1, value: 0n },
            score: { type: 1, value: 0n },
            value: { type: 13, data: 'F97316' },
          },
        },
      },
      // 3 more colors
    ],
  })

  const colors = cvToTrueValue(colors)
  deepEquals(colors, [
    {
      id: 0n, // bigint 0
      score: 0n,
      value: 'F97316',
    },
    // 3 more colors
  ])
}
```

As you can see, the "rawColors" object would be painful to use later in our code. While `cvToTrueValue` recursively browses these values and converts them to a usable JS object.

> :bulb: The `type` properties in `rawColors` tells what is the clarity type of a given value. You may guess what each type means. `11` represents lists, converted to arrays in JS. `7` is for "ok". `13` (which is `0d` in hexadecimal) represents ascii-strings. The full list can be retrieved in [micro-stacks source code](https://github.com/fungible-systems/micro-stacks/blob/5ef1e524c552e8a000f0e72b2289e13b3d0a0567/src/clarity/common/constants.ts#L22-L41).

Here is the store for ColorVote. Again, this is a pretty simple implementation, see below for a more complete one. This store only fetches colors but it will quickly have more method to cast a vote, cancel, or edit it.

#### ./src/hooks/useColorVote.ts
```ts
import create from 'zustand'
import { cvToTrueValue } from 'micro-stacks/clarity'

import { readOnlyRequest } from '../data/stacks'

export const useColorVote = create((set, get) => ({
  colors: [],

  async fetchColors() {
    const rawColors = await readOnlyRequest('get-colors')

    const colors = cvToTrueValue(rawColors)
    set({ colors })
  },
}))
```

<details>
<summary>Improved version with error handling a types safety</summary>

```ts
import create from 'zustand'
import { cvToTrueValue } from 'micro-stacks/clarity'

import { readOnlyRequest } from '../data/stacks'

export interface Color {
  id: bigint
  value: string
  score: bigint
}

interface ColorStore {
  colors: Color[]
  fetchColors: () => Promise<void>
}

function checkColors(colors: unknown): colors is Color[] {
  if (!Array.isArray(colors)) return false
  return colors.reduce((acc, c) => acc && c.value, true)
}

export const useColorVote = create<ColorStore>((set, get) => ({
  colors: [],

  async fetchColors() {
    const rawColors = await readOnlyRequest('get-colors')
    if (!rawColors) return

    const colors = cvToTrueValue(rawColors)
    if (checkColors(colors)) set({ colors })
  },
}))
```

It's looking pretty good like that. We could have written `cvToTrueValue(rawColors) as Colors[]` to make TypeScript happy. But it's good practice to check network responses and ensure types safety. Also, the `checkColors` method could be improved even further, along with error handling.
</details>

This store is now ready to be called. We want to fetch the colors early in our application but we've also seen that we need the user to be authenticated to have a valid `senderAddress` passed to `callReadOnlyFunction`.  
As often, there are multiple ways to achieve it, here is one. We'll modify `App.tsx` to initiate the fetch.

#### ./src/App.tsx
```ts
// add imports
import { useEffect } from 'preact/hooks'
import { useColorVote } from './hooks/useColorVote'
//...

export function App() {
  const { session } = useAuth()
  useEffect(() => {
    // fetch colors without rerendering App
    if (session) useColorVote.getState().fetchColors()
  }, [session])

  // ...
}
```

> :bulb: As you can see, we are not directly calling `useColorVote()`. Instead, `getState` is called to access the `fetchColors` method. This way, the App component doesn't subscribe to the ColorVote hook and won't rerender on change.

We'll use SVGs to display the colors. I made a simple [Circle](https://github.com/hugocaillard/color-webapp-tuto/blob/step-2/src/components/UI/svg/Circle.tsx) component to which we'll pass the colors. The 4 colors options will be displayed in `Vote.tsx`:

#### ./src/pages/Vote.tsx
```tsx
// slightly simplified version
import { Circle } from '../components/UI/svg/Circle'
import { useColorVote } from '../hooks/useColorVote'

export const Vote = () => {
  const { colors } = useColorVote()

  return colors ? (
    <div className="flex">
      {colors.map(({ id, value}) => (
        <Circle key={id} hex={value} />
      ))}
    </div>
  ) : null
}
```

Nothing fancy here, we invoke useColorVote to get the colors from our store and display them on our page with SVG. At this stage, you should see four circles of colors nicely aligned on the page thanks to flexbox.

To make the vote fairer, I'll randomize the order in which the colors are displayed. We won't get into details but you can check [this commit](https://github.com/hugocaillard/color-webapp-tuto/commit/f368cde0bf0bb208c5161cc05b1007349276e54a) to see the changes.  
This way, the order of color is changed every time the page is refreshed.

### Conclusion

We just learned how to fetch data from the smart contract and the web app is starting to take shape. Depending on your JS/TS level, the tutorial may have been more or less simple. I'm trying to keep it simple. You can see how important is JS in the Clarity ecosystem, whether you want to write tests for your smart contract or write a web app. Indeed, front-end skills are required in Web2 and Web3!

> 💻 **Read the code on GitHub**. The source code of this article is on [this branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-2).  
> There is a [PR associated with this article](https://github.com/hugocaillard/color-webapp-tuto/pull/2).
