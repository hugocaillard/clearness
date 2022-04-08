module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              fontSize: 'inherit',
              fontStyle: 'inherit',
              fontWeight: 'medium',
            },
            'blockquote p:first-of-type::before': {
              content: '',
            },
            'blockquote p:last-of-type::after': {
              content: '',
            },
            summary: {
              cursor: 'help',
              fontSize: '1.125rem',
              marginBottom: '0.25rem',
            },
            'code::before': false,
            'code::after': false,
            code: {
              color: 'var(--ifm-color)',
              'border-radius': '0.25rem',
              padding: '0.15rem 0.3rem',
              borderWidth: '1px',
              borderColor: 'rgba(0,0,0,0.1)',
            },
            p: {
              marginTop: '0',
            },
            pre: {
              marginBottom: '1.25rem !important',
            },
            'pre code': {
              borderWidth: '0',
            },
            'a:hover': {
              textDecoration: 'underline !important',
            },
            a: {
              textDecoration: 'none',
            },
            'a code': {
              color: 'unset',
            },
            li: {
              margin: 0,
            },
            'li > img': {
              margin: 0,
              display: 'inline',
            },
            'ol > li::marker': {
              color: 'var(--tw-prose-body)',
            },
            'ul > li::marker': {
              color: 'var(--tw-prose-body)',
            },
            'ul, ol': {
              marginBottom: '1.25rem',
            },
          },
        },
        lg: {
          css: {
            'ul, ol, li, li p': {
              margin: 0,
            },
          },
        },
        invert: {
          css: {
            code: {
              borderColor: 'rgba(255,255,255,0.1)',
            },
          },
        },
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/typography')],
}
