import { useEffect, useRef } from 'react'

const MOBILE_PHASE_QUERY = '(max-width: 780px), (max-height: 620px) and (orientation: landscape)'

export function useMobilePhaseFocus(changeKey: string) {
  const phaseRef = useRef<HTMLDivElement | null>(null)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (typeof window === 'undefined' || !window.matchMedia(MOBILE_PHASE_QUERY).matches) {
      return
    }

    const phaseEl = phaseRef.current
    if (!phaseEl) return

    const rect = phaseEl.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const phaseIsAboveView = rect.top < -24
    const phaseIsBelowView = rect.top > viewportHeight * 0.35

    if (!phaseIsAboveView && !phaseIsBelowView) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.requestAnimationFrame(() => {
      phaseEl.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }, [changeKey])

  return phaseRef
}
