import { useEffect } from 'react'

export function useScroll(cb: (offsetY: number) => void) {
  const onScroll = () => cb(window.scrollY)
  useEffect(() => {
    window.removeEventListener('scroll', onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [cb])
}
