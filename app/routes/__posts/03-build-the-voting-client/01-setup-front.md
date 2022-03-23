---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---

## Set up the front application

In the [previous tutorial](/01-voting-clarity-smart-contract), we learned to develop a basic Smart Contract for the Stacks blockchain. One question you may ask is, how do people will interact with it? How will they actually call the "vote" function of the contract.  
We can consider the Smart Contract as a piece of our back-end. 


Let's write some TypeScript

In order to develop Smart Contracts on Bitcoin, the choices are currently pretty limited; Stacks and Clarity to the rescue. Whereas building a web application offers a lot of options.
The following tutorial is built with this Stack:
- Vite
- Preact
- Zustand (state-management)
- Tailwind
- micro-stacks (interact with our contract)

The purpose of this tuto is to focus on the interactions between our app and the Stack ecosystem. Obviously we won't go into details about the framework 


### Initialize the project

```sh
$ npm init vite@latest color-app
$ cd color-app
$ npm i
$ npm init @eslint/config # optional
$ npm install -D tailwindcss postcss autoprefixer
$ npx tailwindcss init -p
```
Here is the [installation guide for Tailwind](https://tailwindcss.com/docs/guides/vite). Everything else should be pretty much straight forward and up to you.


### Getting started with micro-stacks

```sh
$ npm install micro-stacks zustand
```
