import { marked } from 'marked'

import { ChapterInfo } from '~/data/posts'

type Props = {
  chapter: ChapterInfo
  index: number | null
}

const Title = () => (
  <h1 className="text-7xl !font-bold mb-4 text-blue-700">Ӿ Clearness</h1>
)

const Container = ({ children }: { children: JSX.Element[] | JSX.Element }) => (
  // container bloc, border won't show on screen shot
  <div className="border mx-auto mt-12" style={{ width: '1026px' }}>
    <div
      id="og-img"
      className="px-20 flex flex-col justify-center pb-2"
      style={{ width: '1024px', height: '512px' }}
    >
      <div>
        <Title />
        {children}
      </div>
    </div>
  </div>
)

export const Htag = ({ children }: { children: string }) => (
  <>
    <span className="text-blue-700">#</span>
    {children}
  </>
)

export function OgImagePosts({ chapter, index }: Props) {
  const { title, description, posts } = chapter
  return (
    <Container>
      <h2 className="text-5xl !font-bold mb-4">{title}</h2>

      <div
        className="max-w-3xl text-2xl text-gray-500"
        dangerouslySetInnerHTML={{ __html: marked(description) }}
      />

      <ol className="mt-3 ml-6 list-decimal">
        {posts
          .filter(({ wip }) => !wip)
          .map((p, i) => (
            <li
              key="slug"
              className={`text-2xl font-medium ${
                i === index ? 'font-bold text-gray-800' : 'text-blue-700'
              }`}
            >
              {p.title}
            </li>
          ))}
      </ol>
    </Container>
  )
}

export function OgImageIndex() {
  return (
    <Container>
      <p className="text-4xl mt-12 mb-14">
        Learn to code Smart Contracts on Bitcoin thanks to
        <br />
        Stacks and the <span className="font-semibold">Clarity Language.</span>
      </p>

      <p className="text-4xl font-bold">
        <Htag>Web3</Htag> <Htag>DAO</Htag> <Htag>NFT</Htag> <Htag>Clarity</Htag>{' '}
        <Htag>Stacks</Htag> <Htag>Bitcoin</Htag>
      </p>
    </Container>
  )
}
