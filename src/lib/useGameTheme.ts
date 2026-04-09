import { useState } from 'react'

/**
 * Shared dark/light toggle for all games.
 * Persists choice to localStorage so it survives navigation.
 */
export function useGameTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('game-theme') !== 'light' }
    catch { return true }
  })

  function toggle() {
    setIsDark(prev => {
      const next = !prev
      try { localStorage.setItem('game-theme', next ? 'dark' : 'light') } catch {}
      return next
    })
  }

  return { isDark, toggle }
}
