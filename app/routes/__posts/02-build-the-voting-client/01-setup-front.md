## Set up the front application

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
