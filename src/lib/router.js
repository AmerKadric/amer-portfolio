import { useEffect, useState } from 'react'

const parse = () => window.location.hash.replace(/^#\/?/, '')

// Hash routes (#/experience) so the static Vercel deploy needs no rewrites.
export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function go(route) {
  if (route) {
    window.location.hash = '/' + route
  } else {
    history.pushState(null, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}
