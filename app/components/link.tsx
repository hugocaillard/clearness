import { NavLink as RemixLink, NavLinkProps } from 'remix'

import { cleanClass } from './utils'

export default function Link({ to, children, className }: NavLinkProps) {
  return (
    <RemixLink
      to={to}
      prefetch="intent"
      className={({ isActive }) =>
        isActive
          ? `cursor-default text-slate-800 dark:text-slate-200 ${className}`
          : cleanClass(`text-blue-700 dark:text-sky-400 \
              hover:text-blue-100 hover:dark:text-sky-800\
              before:bg-blue-900 dark:before:bg-white ${className}`)
      }
    >
      {children}
    </RemixLink>
  )
}
