import { H1 } from './headings'
import Link from './link'

interface HeaderProps {
  width: string
}

// lil' bit of scripting to handle theme switching
const themeScript = `\
let theme = localStorage.theme === 'dark' || !('theme' in localStorage) && \
window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';\
const checkbox = document.getElementById('switch-theme');\
checkbox.checked = theme === 'dark';\
checkbox.addEventListener('click', () => {\
const prev = theme;\
theme = prev === 'light' ? 'dark' : 'light';\
localStorage.setItem('theme', theme);\
document.documentElement.classList.replace(prev, theme);\
})`

export function Header({ width }: HeaderProps) {
  return (
    <header className="sticky mt-10 mb-8 border-solid border-gray-400 dark:border-gray-600">
      <div className={`${width} flex justify-between items-center`}>
        <span className="text-5xl !font-bold mb-2">
          <Link to="/" className="flex gap-2">
            Ӿ <H1>Clearness</H1>
          </Link>
        </span>

        <div>
          <input
            id="switch-theme"
            name="switch-theme"
            className="hidden"
            type="checkbox"
          />
          <label
            className="switch-theme cursor-pointer p-2"
            htmlFor="switch-theme"
          />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </header>
  )
}
