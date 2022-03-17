import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [])

  const setPreferredTheme = (pref: typeof theme) => {
    setTheme(pref)
    if (pref) localStorage.setItem('theme', pref)
    else localStorage.removeItem('theme')
  }

  return [theme, setPreferredTheme] as const
}
