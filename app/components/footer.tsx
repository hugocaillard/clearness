function FooterLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      className="text-blue-700 hover:text-blue-900 dark:text-sky-500 hover:dark:text-sky-300"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {text}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="px-6 border-t border-dashed border-gray-600 py-6 mt-6 text-center">
      <FooterLink href="https://twitter.com/cohars" text="@Cohars" /> -{' '}
      <FooterLink
        href="https://github.com/hugocaillard/clearness"
        text="GitHub"
      />{' '}
      - Copyright - 2022
    </footer>
  )
}
