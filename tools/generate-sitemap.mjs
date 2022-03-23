/*
  using playwright "test" to genereate oepn graph image
  and storing them into the public folder
  puppeteer may be more suited but playwright is already installed
*/

import path from 'path'
import { readFile, readdir, writeFile, unlink } from 'fs/promises'
import frontMatter from 'front-matter'

const dir = path.join('./app/routes/__posts')
const dest = path.join('./public/sitemap.xml')

async function cleanDest() {
  try {
    return unlink(dest)
  } catch (err) {
    console.log(err)
  }
}

const base = 'https://www.clearness.dev'

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
      posts: frontMatter(posts.toString()).attributes.posts,
    }))
    .flatMap(({ chapter, posts }) =>
      Object.entries(posts)
        .filter(([, { wip }]) => !wip)
        .map(([title]) => `${chapter}/${title}`),
    )

  return []
    .concat(
      mdData.map((d) => `${d.chapter}`), // chapter pages
      chaptersPaths, // article pages
    )
    .map((p) => `${base}/${p}`)
}

async function generate() {
  try {
    await cleanDest()
  } catch (err) {}
  const paths = [base].concat(await getPaths())

  await writeFile(
    dest,
    `\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (p) => `\
  <url>
    <loc>${p}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>`,
  )

  console.log('done')
}
generate()
