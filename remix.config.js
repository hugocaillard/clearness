// const clarity = require('./clarity-prism.js')

/**
 * @type {import('@remix-run/dev/config').RemixMdxConfigFunction}
 */
const mdx = async () => {
  const [
    remarkGFM,
    remarkEmoji,
    rehypePrism,
    rehypeExternalLinks,
    rehypeSlug,
    rehypeAutolink,
    clarity,
  ] = await Promise.all([
    import('remark-gfm').then((mod) => mod.default),
    import('remark-emoji').then((mod) => mod.default),
    import('@mapbox/rehype-prism').then((mod) => mod.default),
    import('rehype-external-links').then((mod) => mod.default),
    import('rehype-slug').then((mod) => mod.default),
    import('rehype-autolink-headings').then((mod) => mod.default),
    import('./clarity-prism.js').then((mod) => mod.default),
  ])

  return {
    remarkPlugins: [remarkGFM, remarkEmoji],
    rehypePlugins: [
      rehypePrism.bind(this, { ignoreMissing: true, syntaxes: [clarity] }),
      rehypeExternalLinks.bind(this, {
        target: '_blank',
        rel: ['nofollow', 'noopener', 'noreferrer'],
      }),
      rehypeSlug,
      rehypeAutolink,
    ],
  }
}

/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  publicPath: '/build/',
  serverBuildDirectory: 'api/_build',
  ignoredRouteFiles: ['.*'],
  mdx,
}
