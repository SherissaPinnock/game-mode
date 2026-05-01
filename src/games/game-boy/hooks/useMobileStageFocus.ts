import { useEffect, useRef } from 'react'

const MOBILE_STAGE_QUERY = '(max-width: 780px), (max-height: 620px) and (orientation: landscape)'

export function useMobileStageFocus(changeKey: string) {
  const stageRef = useRef<HTMLElement | null>(null)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (typeof window === 'undefined' || !window.matchMedia(MOBILE_STAGE_QUERY).matches) {
      return
    }

    const stageEl = stageRef.current
    if (!stageEl) return

    const rect = stageEl.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const stageIsAboveView = rect.top < -24
    const stageIsBelowView = rect.top > viewportHeight * 0.35

    if (!stageIsAboveView && !stageIsBelowView) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.requestAnimationFrame(() => {
      stageEl.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }, [changeKey])

  return stageRef
}
