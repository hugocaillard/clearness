import {
  Link,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  Outlet,
  useLoaderData,
  useLocation,
} from 'remix'
import invariant from 'tiny-invariant'
import prismThemeDark from 'prism-themes/themes/prism-coldark-dark.min.css'

import { ChapterInfo, ChaptersList, getChapterInfo } from '~/data/posts'
import ChapterTOC from '~/components/chapter-toc'
import { PrevNextLink } from '~/components/prev-next-link'
import { cleanClass } from '~/components/utils'
import { OgImagePosts } from '~/components/og-img'
import { getMeta, isOg } from '~/data/meta'

function isValidData(data: Record<string, any>): data is ChapterInfo {
  if (!Array.isArray(data.posts)) return false
  const validPosts = data.posts.reduce(
    (acc: boolean, p) => acc && !!p.title && !!p.slug && !!p.description,
    true,
  )
  return data.title && data.description && data.posts && validPosts
}

function pathToArray(p: string) {
  return p
    .toLocaleLowerCase()
    .split('/')
    .filter((s) => s)
}

export const meta: MetaFunction = ({ data, location }) => {
  const [, slug] = pathToArray(location.pathname)
  invariant(isValidData(data), `${location} invalid data`)

  if (slug) {
    const { posts } = data
    const post = posts.find((p) => p.slug === slug)!
    const title = `Clearness - Lean Clarity - ${post.title}`
    const { description } = post

    return getMeta({
      title,
      description,
      path: [data.slug, post.slug],
      type: 'article',
      alt: `${title} - ${post.title}`,
    })
  }

  const title = `Clearness - Lean Clarity - ${data.title}`
  const { description } = data
  return getMeta({
    title,
    description,
    path: [data.slug],
    type: 'website',
    alt: `${title} - ${description}`,
  })
}

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: prismThemeDark }]
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const [chapter] = pathToArray(url.pathname) as [ChaptersList]

  try {
    return getChapterInfo(chapter)
  } catch (err) {
    throw new Response('Not Found', {
      status: 404,
    })
  }
}

export default function Posts() {
  const chapter = useLoaderData<ChapterInfo>()
  const location = useLocation()
  const [, slug] = location.pathname.replace('/', '').split('/')

  const posts = chapter.posts.filter((p) => !p.wip)
  const index = slug ? posts.findIndex((p) => p.slug === slug) : null

  const [previous, next] =
    index !== null
      ? [posts[index - 1], posts[index + 1]]
      : [undefined, undefined]

  if (isOg(location.search)) {
    return <OgImagePosts {...{ chapter, index }} />
  }

  return (
    <article className="min-w-full">
      <ChapterTOC {...chapter} />
      <div
        className={cleanClass(`prose prose-blue dark:prose-invert max-w-none\
        prose-li:prose-lg prose-p:prose-lg\
        prose-p:text-black dark:prose-p:text-white\
        prose-li:text-black dark:prose-li:text-white`)}
      >
        <Outlet />
        <section className="flex justify-between mt-6 pt-6 border-t border-slate-500">
          <PrevNextLink post={previous} type="prev" />
          <PrevNextLink post={next} type="next" />
        </section>
      </div>
    </article>
  )
}

export function CatchBoundary() {
  return (
    <div className="prose dark:prose-invert min-w-full">
      <h2>We could not find that page!</h2>
      <Link to="/">Home</Link>
    </div>
  )
}
