import { NavLink as RemixLink, NavLinkProps } from 'remix'

import { cleanClass } from './utils'

export default function Link({ to, children }: NavLinkProps) {
  return (
    <RemixLink
      to={to}
      prefetch="intent"
      className={({ isActive }) =>
        isActive
          ? `cursor-default`
          : cleanClass(`text-blue-700 dark:text-blue-500 \
              hover:text-blue-100 hover:dark:text-blue-800\
              before:bg-blue-900 dark:before:bg-white`)
      }
    >
      {children}
    </RemixLink>
  )
}
