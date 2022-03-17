/*
  using playwright "test" to genereate oepn graph image
  and storing them into the public folder
  puppeteer may be more suited but playwright is already installed
*/

import path from 'path'
import { readFile, readdir, unlink } from 'fs/promises'
import frontMatter from 'front-matter'
import { test } from '@playwright/test'

import type { ChapterAttributes } from '~/data/posts'

test.use({ baseURL: 'http://localhost:3011' })

const dir = path.join(__dirname, '../..', 'app/routes/__posts')
const dest = path.join(__dirname, '../..', 'public/images/og')

async function cleanDest() {
  try {
    const files = await readdir(dest)
    return Promise.all(files.map((file) => unlink(`${dest}/${file}`)))
  } catch (err) {
    console.log(err)
  }
}

async function getPaths() {
  const chapters = await readdir(dir)

  const mdData = await Promise.all(
    chapters.map(async (p) => ({
      chapter: p,
      posts: await readFile(path.join(dir, p, 'index.md')),
    })),
  )

  const chaptersPaths = mdData
    .map(({ chapter, posts }) => ({
      chapter,
      posts: frontMatter<ChapterAttributes>(posts.toString()).attributes.posts,
    }))
    .flatMap(({ chapter, posts }) =>
      Object.entries(posts).map(([title]) => `${chapter}/${title}`),
    )

  return ([] as string[]).concat(
    mdData.map((d) => `${d.chapter}`),
    chaptersPaths,
  )
}

test.beforeAll(async () => {
  await cleanDest()
})

test.describe('og images', async () => {
  test('take home screeshot', async ({ page }) => {
    await page.goto('/?og=1')
    await page.locator('div#og-img').screenshot({
      path: path.join(dest, `home.png`),
    })
  })

  test('take chapters and posts screenshots', async ({ page }) => {
    const paths = await getPaths()

    for await (const p of paths) {
      await page.goto(`/${p}?og=1`)
      await page.locator('div#og-img').screenshot({
        path: path.join(dest, `${p.replace(/\//g, '-')}.png`),
      })
    }
  })
})
