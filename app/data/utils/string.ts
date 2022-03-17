export function qs(query?: string | null): Record<string, string | undefined> {
  if (!query) return {}

  return query
    .replace('?', '')
    .split('&')
    .reduce((acc, q) => {
      const [k, v] = q.split('=')
      return { ...acc, [k]: v }
    }, {})
}
