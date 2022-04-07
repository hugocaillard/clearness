---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

In the [previous tutorial](/01-voting-clarity-smart-contract), we learned to develop a simple Smart Contract for the Stacks blockchain. One question you may ask is how do people will interact with it? How will they call the "vote" function of the contract?  
We can consider the Smart Contract as a piece of our back-end. This part will focus on the front-end part: the "Web3 app".

> :bulb: In this first article, we will set up our web app and some tools (Docker, Hiro Wallet). Although it's not the funniest part, we must go through this.

### The (web) stack

When developing Smart Contracts on Bitcoin, the choices are currently pretty limited; Stacks and Clarity to the rescue. Whereas building a web application offers a lot of options.
The following tech stack is used in this tutorial:
- [Vite](https://vitejs.dev/) (tooling, mainly to compile our [Typescript](https://www.typescriptlang.org/) code)
- [Preact](https://preactjs.com/) (you can use React, Vue, nothing, or anything)
- [Zustand](https://github.com/pmndrs/zustand) (state-management)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [micro-stacks](https://github.com/fungible-systems/micro-stacks) (interact with our smart contract)

The purpose of this tuto is to focus on the **interactions between our app and the Stacks ecosystem**. So we won't go into details regarding the tech libraries, feel free to try and follow along with any tools you are comfortable with.

### Use Stacks Wallet and the Devnet

We will use the [Hiro Wallet](https://www.hiro.so/wallet#download).  
It is recommended to set up a dedicated "development" session in my web browser with the Hiro Wallet and some developer tools. You want to keep your real wallet separated since we'll need to connect to a fake one now. Open the Voting smart contract project, find the file `settings/Devnet.toml`, you'll find here a list of Stack accounts. These fake accounts are used with clarinet test. We'll also use it to connect to the Devnet locally. You can run **`$ clarinet integrate`** to launch the Devnet, you'll need [Docker](https://www.docker.com/) to be running.

> :point_right: The *Devnet* is a Stacks environment that runs on your computer.

If not done already, open the Hiro Web Wallet, select *"Already have a Stacks account? Sign in with Secret Key"* and use a Secret Key from your [Devnet settings](https://github.com/hugocaillard/clarity-voting-tuto/blob/343f47fc39be15ea856f01b6e13de5cd13da3f77/settings/Devnet.toml#L13). Make sure not to use a real one. Once connected, click on "Change Network" and pick `Devnet`.

Now that our Wallet is wired to the Devnet and that we are authenticated with our fake account. Let's set up our web app.

### Getting started with micro-stacks

Download [this project (branch: "step-0")](https://github.com/hugocaillard/color-webapp-tuto/tree/step-0) to follow along. Run:
```bash
$ npm i
$ npm run dev
```
Your application should be running on [localhost:3003](http://localhost:3003/).

Have a look at the README.md to understand more about the setup. It's a simple project with an empty page and a few UI components. Here begins the fun part.

```bash
$ npm install micro-stacks zustand
```

### [micro-stacks](https://micro-stacks.dev/) ([docs](https://docs.micro-stacks.dev/))

Micro-stacks is a light library to build Stacks apps. It integrates with the Stacks Wallet for the Web and will allow us to communicate with Smart contracts. In this tutorial, we will mainly use it to authenticate, call read-only or public functions, and check the status of transactions.

### [zustand](https://github.com/pmndrs/zustand)

Zustand is a light state management library for React. I chose it because of its simplicity. It has a low amount of boilerplate needed and is unopinionated. Think Redux or the Context API, but simpler and funnier.

### Authenticate with the Stacks Wallet

Micro-stacks exposes a method called `authenticate` that will open a Wallet pop up and ask for the user permissions to authenticate. Here is what it looks like:

```ts
import { authenticate } from 'micro-stacks/connect'

// ...
  const session = await authenticate({ appDetails: {
    name: 'Colors Vote Tuto',
    icon: `localhost:3003/src/favicon.svg`,
  } })
```

Since this `session` object will be much needed, it will be stored in a Zustand store.  
Our store will look like that (see below for the TS version):

#### ./src/stores/useAuth.ts
```ts
import { authenticate } from 'micro-stacks/connect'
import create from 'zustand'

export const useAuth = create((set) => ({
  session: null,

  connect: async () => {
    const session = await authenticate({
      appDetails: { name: 'Colors Vote Tuto', icon: `/src/favicon.svg` },
    })
    set({ session })
  },
}))

```

<details>
<summary>Here is a slightly better version with **TypeScript** and error handling</summary>

#### ./src/stores/useAuth.ts
```ts
import { StacksSessionState, authenticate } from 'micro-stacks/connect'
import create from 'zustand'

interface AuthStore {
  session: StacksSessionState | null
  connect: () => Promise<void>
}

const appDetails = {
  name: 'Colors Vote Tuto',
  icon: `localhost:3003/src/favicon.svg`,
}

export const useAuth = create<AuthStore>((set) => ({
  session: null,

  connect: async () => {
    try {
      const session = await authenticate({ appDetails })
      if (!session) throw new Error('invalid session')
      set({ session })
    } catch (err) {
      console.warn(err)
    }
  },
}))
```
</details>

This store will be used in the [Header component](https://github.com/hugocaillard/color-webapp-tuto/blob/step-0/src/components/Header.tsx) to open the popup when the button is clicked. Import `useAuth`, it's a hook that exposes a `connect` method that is passed to `onClick`.

#### ./src/components/Header.tsx
```ts
// imports...
import { useAuth } from '../stores/useAuth'

export const Header = () => {
  const { connect, session } = useAuth()

  return (
    <header>
      <Container className="h-16 flex justify-between items-center">
        <H1>Color App</H1>

        {session ? null : <Button onClick={connect}>Connect Wallet</Button>}
      </Container>
    </header>
  )
}
```

That is all for now. Please check the [pull request associated with this article](https://github.com/hugocaillard/color-webapp-tuto/pull/1) to see two other implemented features:
- Retrieve the [session in the local storage](https://github.com/hugocaillard/color-webapp-tuto/blob/227b2019b6f10184696b6d0af6b3ec7f22596dde/src/stores/useAuth.ts#L15-L25). Indeed micro-stacks stores it for us :muscle:
- Add a [disconnect function](https://github.com/hugocaillard/color-webapp-tuto/blob/227b2019b6f10184696b6d0af6b3ec7f22596dde/src/stores/useAuth.ts#L30-L33) that clears the session.

## Conclusion

We've seen in this introduction how to quickly set up a web app project with some great tools. Thanks to micro-stacks and zustand, our first interaction with the Hiro Wallet was quite simple to integrate.

We'll see in the following article how to call our contract and fetch the vote options.

> 💻 **Read the code on GitHub**. The source code of this article is on [this branch](https://github.com/hugocaillard/color-webapp-tuto/tree/step-1).  
> There is a [PR associated with this article](https://github.com/hugocaillard/color-webapp-tuto/pull/1).
