import { marked } from 'marked'

import { ChapterInfo } from '~/data/posts'
import { H2 } from './headings'
import Link from './link'

export default function ChapterTOC({
  slug,
  title,
  description,
  posts,
}: ChapterInfo) {
  return (
    <div className="mb-5">
      <H2 small>{title}</H2>
      <div
        className="my-5"
        dangerouslySetInnerHTML={{ __html: marked(description) }}
      />
      <ol className="list-decimal ml-12">
        {posts
          .filter(({ wip }) => !wip)
          .map((post) => (
            <li key={post.slug} className="text-lg font-medium">
              <Link to={`/${slug}/${post.slug}`}>{post.title}</Link>
            </li>
          ))}
      </ol>
    </div>
  )
}
