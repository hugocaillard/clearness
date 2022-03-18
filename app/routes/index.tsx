import {
  HeadersFunction,
  LoaderFunction,
  MetaFunction,
  useLoaderData,
  useLocation,
  useOutletContext,
} from 'remix'

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
  const title = 'Clearness'
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
      {posts
        .filter(({ wip }) => !wip)
        .map((p) => (
          <div key={p.slug} className="mb-10">
            <H2>
              <Link to={`${p.chapter.slug}/${p.slug}`}>{p.title}</Link>
            </H2>
            <DateString date={p.publicationDate} formatter={dateFormatter} /> in{' '}
            <span className="font-medium">
              <Link to={p.chapter.slug}>{p.chapter.title}</Link>
            </span>
            <p>{p.description}</p>
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
