interface HeadingProps {
  children: (JSX.Element | string)[] | JSX.Element | string
  small?: boolean
}

export function H1({ children }: HeadingProps) {
  return <h1 className="text-5xl !font-bold mb-2">{children}</h1>
}

export function H2({ children, small }: HeadingProps) {
  const className = !small
    ? 'text-3xl !font-bold leading-10 mb-2'
    : 'text-xl !font-semibold'

  return <h2 className={className}>{children}</h2>
}

export function H3({ children }: HeadingProps) {
  return <h3 className="text-xl !font-semibold">{children}</h3>
}

export function H4({ children }: HeadingProps) {
  return (
    <h4 className="uppercase text-sm text-slate-600 dark:text-slate-400 bold leading-4">
      {children}
    </h4>
  )
}
