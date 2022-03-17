// import { Buffer } from 'buffer'

// POC
// Display clarity code along with the ClarityTools link

// export function ClarityCode({ children }: { children: string }) {
//   const b64Code = Buffer.from(children, 'utf-8').toString('base64')
//   const link = `https://clarity.tools/code?${b64Code}`

//   return (
//     <>
//       <pre className="languag-clarity">
//         <code className="languag-clarity">{children}</code>
//       </pre>

//       <a target="_blank" rel="noreferrer" href={link}>
//         💻 Open in ClarityTools
//       </a>
//     </>
//   )
// }
export function ClarityCode({ children }: { children: string }) {
  return <></>
}
