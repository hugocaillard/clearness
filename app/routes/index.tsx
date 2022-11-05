import { useLoaderData, useLocation, useOutletContext } from '@remix-run/react'
import { HeadersFunction, LoaderFunction, MetaFunction } from '@remix-run/node'

import DateString from '~/components/date-string'
import Link from '~/components/link'
import { H2 } from '~/components/headings'
import { ChapterInfo, getChapters } from '~/data/posts'
import { ContextType } from '~/root'
import { OgImageIndex } from '~/components/og-img'
import { getMeta, getCanonical, isOg } from '~/data/meta'

export const headers: HeadersFunction = () => {
  return {
    // 30days CDN cache (30 * 24 * 60 * 60)
    'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=2592000',
  }
}

export const meta: MetaFunction = ({ data }) => {
  const title = 'Clearness - Learn Clarity, build Smart Contracts on Bitcoin'
  const description =
    'Learn to code Smart Contracts on Bitcoin thanks to Stacks and the Clarity Language. Learn Web3, DAO, NFT etc'

  return getMeta({
    title,
    description,
    type: 'website',
    alt: `${title} - ${description}`,
  })
}

export const loader: LoaderFunction = async () => {
  return {
    canonical: getCanonical(),
    chapters: await getChapters(),
  }
}

export default function Index() {
  const { dateFormatter } = useOutletContext<ContextType>()

  const { chapters } = useLoaderData<{ chapters: ChapterInfo[] }>()
  const posts = chapters
    .flatMap((c) => c.posts)
    .sort(
      (a, b) =>
        new Date(b.publicationDate).getTime() -
        new Date(a.publicationDate).getTime(),
    )

  const location = useLocation()
  if (isOg(location.search)) return <OgImageIndex />

  return (
    <>
      <h2 className="font-medium text-xl">
        ✨ Get started with Clarity:{' '}
        <Link to="/01-voting-clarity-smart-contract/01-getting-started">
          Write your First <span className="font-bold">Smart Contract</span> on
          Stacks
        </Link>
      </h2>

      <hr className="mt-8 mb-6" />

      {posts
        .filter(({ wip }) => !wip)
        .map((p) => (
          <div key={p.slug} className="mb-10">
            <H2>
              <Link to={`${p.chapter.slug}/${p.slug}`}>{p.title}</Link>
            </H2>
            <span className="text-slate-600 dark:text-slate-400">
              <DateString date={p.publicationDate} formatter={dateFormatter} />{' '}
            </span>
            in{' '}
            <span className="font-medium">
              <Link to={p.chapter.slug}>{p.chapter.title}</Link>
            </span>
            <p className="mt-1">{p.description}</p>
          </div>
        ))}
    </>
  )
}

export function CatchBoundary() {
  return (
    <div className="prose dark:prose-invert min-w-full">
      <h2>Something bad happened</h2>
    </div>
  )
}
