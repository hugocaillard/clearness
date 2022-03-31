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
    lazyLoad,
    clarity,
  ] = await Promise.all([
    import('remark-gfm').then((m) => m.default),
    import('remark-emoji').then((m) => m.default),
    import('@mapbox/rehype-prism').then((m) => m.default),
    import('rehype-external-links').then((m) => m.default),
    import('rehype-slug').then((m) => m.default),
    import('rehype-autolink-headings').then((m) => m.default),
    import('rehype-plugin-image-native-lazy-loading').then((m) => m.default),
    import('./clarity-prism.js').then((m) => m.default),
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
      lazyLoad,
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
