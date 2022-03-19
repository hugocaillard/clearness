import {
  Links,
  LinksFunction,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
} from 'remix'
import langParser from 'accept-language-parser'

import tailwind from './tailwind.css'
import { Header } from './components/header'
import { Footer } from './components/footer'
import { cleanClass } from './components/utils'
import { getCanonical, isOg } from './data/meta'

export const links: LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'stylesheet', href: tailwind },
]

// avoid theme flashing
const themeScript = `\
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && \
window.matchMedia('(prefers-color-scheme: dark)').matches\
)) document.documentElement.classList.replace('light', 'dark')`

export type ContextType = {
  dateFormatter: Intl.DateTimeFormat
}

export const loader: LoaderFunction = async ({ request }) => {
  const { headers } = request
  const parsed = langParser.parse(headers.get('accept-language') || 'en')
  // select english if available, otherwise take first choice
  const lang = parsed.find((p) => p.code === 'en') ? 'en' : parsed[0].code

  return { lang }
}
export default function App() {
  const { lang } = useLoaderData()

  const context: ContextType = {
    dateFormatter: new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
    }),
  }

  const includeScripts = false

  const location = useLocation()
  const ogImgContext = isOg(location.search)
  const mainClass = ogImgContext ? 'mx-auto' : 'max-w-3xl px-6 mx-auto'

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const canonicalPath = lastMatch
    ? lastMatch.pathname.split('/').filter((s) => s)
    : []

  return (
    <html lang="en" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="google-site-verification"
          content="AdZrNXdONpMrq1hiNOUwou54kcsK3Z57UWKsVKe5X0A"
        />
        <Meta />

        <Links />
        {lastMatch ? (
          <link rel="canonical" href={getCanonical(canonicalPath)} />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NODE_ENV === 'production' && (
          <script
            defer
            data-domain="clearness.dev"
            src="https://plausible.io/js/plausible.js"
          ></script>
        )}
      </head>

      <body
        className={cleanClass(`min-h-screen flex flex-col antialiased\
        bg-white dark:bg-slate-900 text-slate-900 dark:text-white\
        transition-colors duration-200 ease-in-out`)}
      >
        <div className="flex-auto">
          {ogImgContext ? null : <Header width="max-w-3xl px-6 mx-auto" />}

          <main className={mainClass}>
            <Outlet context={context} />
          </main>
        </div>

        <Footer />

        <ScrollRestoration />
        {includeScripts ? <Scripts /> : null}
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  )
}
