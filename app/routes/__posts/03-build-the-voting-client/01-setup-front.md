---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

In the [previous tutorial](/01-voting-clarity-smart-contract), we learned to develop a basic Smart Contract for the Stacks blockchain. One question you may ask is: how do people will interact with it? How will they actually call the "vote" function of the contract.  
We can consider the Smart Contract as a piece of our back-end. This part will focus on the front-app part; the "Web3 app".

### The (web) stack

When developing Smart Contracts on Bitcoin, the choices are currently pretty limited; Stacks and Clarity to the rescue. Whereas building a web application offers a lot of options.
The following tutorial has been built with this stack:
- [Vite](https://vitejs.dev/) (tooling, mainly to compile our [Typescript](https://www.typescriptlang.org/) code)
- [Preact](https://preactjs.com/) (you can use React, Vue, nothing or anything)
- [Zustand](https://github.com/pmndrs/zustand) (state-management)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [micro-stacks](https://github.com/fungible-systems/micro-stacks) (interact with our smart contract)

The purpose of this tuto is to focus on the **interactions between our app and the Stacks ecosystem**. So you can we won't go into details regarding the tech libraries, feel free to try and follow along with any tools you are comfortable with.

> :point_right: You can even use [stacks.js](https://github.com/hirosystems/stacks.js) instead of [micro-stacks](https://github.com/fungible-systems/micro-stacks). They have a similar API. I'll use the latter because it plays nice with Vite.

### Getting started with micro-stacks

Download this [project (branch: "step-0")](https://github.com/hugocaillard/color-webapp-tuto/tree/step-0) to follow along. Run:
```bash
$ npm i
$ npm run dev
```
You application should be running on [localhost:3003](http://localhost:3003/).

Have a look at the README.md to understand more about the setup. It's a simple project with an empty page and a few UI components. Here begins the fun part.

```bash
$ npm install micro-stacks zustand
```

### micro-stacks

