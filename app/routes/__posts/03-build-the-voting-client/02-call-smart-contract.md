---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

In the previous article we worked on some mandatory steps to get started. The people visiting our web app are now able to authenticate with their Stacks Wallet. Once logged in, they will be able to call the functions exposed by our contract.

> :bulb: Make sure that your code from the previous article is working. You can pull the code from the [step-1 branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-1).

### **Read-only** VS **Public** Functions

In the very [first article](/01-voting-clarity-smart-contract/01-getting-started) of the voting smart contract series, I explained the difference between `read-only` and `public` functions. It will seem support important now that will call the contract from our web app.

While these two types of functions are publicly exposed, they have a few fundamental differences.
- :point_right: A call to a read-only function is an HTTP request to a stacks-api endpoint. So no fees are required.
- :point_right: Calling a public function means creating a transaction that will be validated by a miner, who will be rewarded with the fees set by the caller. It requires to open a web wallet popup and to wait a few minutes for the transaction to be validated.

From a developer point of view, it means that calling a read-only function or a public one will be different.

### Fetch Color options

The "color-vote" contract is our source of truth, it exposes the vote options that can be fetched by calling the read-only function `get-colors`.  
Create a file called `./src/data/stacks.ts` in which we will abstract calls to our contract. First, we will require some of our dependencies, declare some functions and instanciate a "network" object:

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

The `ADDRESS` stores the stacks address on which our contract is deployed. In development, the contract was deployed by running `$ clarinet integrate`. It uses the [deployer address in the Devnet.toml file](https://github.com/hugocaillard/clarity-voting-tuto/blob/343f47fc39be15ea856f01b6e13de5cd13da3f77/settings/Devnet.toml#L9).

In the future, we will add some logic to handle call to the testnet or the mainnet. For now, working with the Devnet is enough.

> :point_up: "devnet" and "mocknet" are synonyms. It's your locally running Stacks network.
> The "mainnet" is the real Stacks network while the "testnet" is similare one but were everything is fake.

The `callReadOnlyFunction` method is quite self explanatory. As explained above, it will call a stacks API endpoint that will call a smart contract's read-only function. It accept an option argument. Here is a description of the required options:

```ts
callReadOnlyFunction({
  contractAddress, // the address where the contract is deployed
  contractName, // the name of the contract
  functionName, // the read-only function to call
  functionArgs, // an array of arguments to pass to the read-only function
  senderAddress, // the address of the wallet making the call
  network, // the devnet, testnet or mainnet object
})
```

Let's write a function called `readOnlyRequest` that will allow us to call read-only function on the `color-vote` contract.

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

> :bulb: We just used another great feature of zustand, we can call `getState` on a store hook outside of a React component. Here it allows us to get the address of the logged in wallet.

This first implementation is quite simple, but not very secure.

<details>
<summary>Here is an extended version with TS and error handling</summary>

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
