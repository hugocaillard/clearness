import { Post } from '~/data/posts'
import Link from './link'

type Props = {
  post?: Post
  type: 'prev' | 'next'
}

export function PrevNextLink({ post, type }: Props) {
  return (
    <div>
      {post && !post.wip ? (
        <Link to={`/${post.chapter.slug}/${post.slug}`}>
          {type === 'prev' && '< '}
          {post.title}
          {type === 'next' && ' >'}
        </Link>
      ) : null}
    </div>
  )
}
