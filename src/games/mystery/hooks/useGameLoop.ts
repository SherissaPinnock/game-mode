import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { tickChar, type Char } from '../engine/characters'
import { TICK_MS } from '../data/constants'

/** Runs the character movement loop for the lifetime of the component. */
export function useGameLoop(setChars: Dispatch<SetStateAction<Char[]>>) {
  useEffect(() => {
    const id = setInterval(() => setChars(prev => prev.map(tickChar)), TICK_MS)
    return () => clearInterval(id)
  }, [setChars])
}
