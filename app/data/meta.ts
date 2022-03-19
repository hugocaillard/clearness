import { qs } from './utils/string'

const base = 'https://www.clearness.dev'

const strip = (path: string[]) => path.map((p) => p.replace(/ |\//g, ''))

const imageSuf = '19032022'

export const getCanonical = (path: string[] = []) =>
  path.length === 0 ? base : `${base}/${strip(path).join('/').toLowerCase()}`

export const getOgImgURL = (path: string[] = ['home']) =>
  `${base}/images/og/${strip(path).join('-').toLowerCase()}.png`

export const isOg = (search: null | string) =>
  process.env.NODE_ENV !== 'production' && qs(search).og

type Meta = {
  title: string
  description: string
  type: 'website' | 'article'
  alt: string
  path?: string[]
}

export function getMeta(data: Meta) {
  const image = getOgImgURL(data.path)
  const url = getCanonical(data.path)

  return {
    title: data.title,
    description: data.description,

    'og:site_name': 'Clearness',
    'og:url': url,
    'og:type': data.type,
    'og:title': data.title,
    'og:description': data.description,
    'og:image': `${image}?19032022`,
    'og:image:width': '1024',
    'og:image:height': '512',
    'og:image:alt': data.alt,

    'twitter:card': 'summary_large_image',
    'twitter:site': '@Cohars',
    'twitter:creator': '@Cohars',
    'twitter:domain': 'learness.dev',
    'twitter:url': url,
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': `${image}?19032022`,
    'twitter:image:alt': data.alt,
  }
}
