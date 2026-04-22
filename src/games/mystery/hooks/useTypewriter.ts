import { useState, useEffect } from 'react'

interface TypewriterResult {
  typed: string
  done: boolean
  skip: () => void
}

/** Reveals `text` character-by-character at `speed` ms per char. */
export function useTypewriter(text: string, speed = 32): TypewriterResult {
  const [typed, setTyped] = useState('')
  const [done,  setDone]  = useState(false)

  useEffect(() => {
    setTyped('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  function skip() {
    setTyped(text)
    setDone(true)
  }

  return { typed, done, skip }
}
