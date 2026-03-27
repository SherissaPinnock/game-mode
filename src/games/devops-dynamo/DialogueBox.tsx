import { useEffect, useRef, useState } from 'react'
import explainingImg from '@/assets/character/explaining character.png'
import sadImg from '@/assets/character/sad character.png'
import happyImg from '@/assets/character/thumbs up character.png'
import { playPop, playVoiceOver } from '@/lib/sounds'
export type CharacterMood = 'explaining' | 'sad' | 'happy'

const MOOD_IMAGES: Record<CharacterMood, string> = {
  explaining: explainingImg,
  sad: sadImg,
  happy: happyImg
}

const CHAR_DELAY = 55 // ms per character
const LINE_PAUSE = 200 // ms pause between lines

interface DialogueBoxProps {
  mood: CharacterMood
  lines: string[]
  buttonLabel: string
  onContinue: () => void
}

export function DialogueBox({ mood, lines, buttonLabel, onContinue }: DialogueBoxProps) {
  const fullText = lines.join('\n\n')
  const [displayedLen, setDisplayedLen] = useState(0)
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when lines change
  useEffect(() => {
    playVoiceOver()
    setDisplayedLen(0)
    setDone(false)
  }, [fullText])

  // Typewriter tick
  useEffect(() => {
    if (displayedLen >= fullText.length) {
      setDone(true)
      return
    }

    // Pause at paragraph breaks (\n\n)
    const nextTwo = fullText.slice(displayedLen, displayedLen + 2)
    const delay = nextTwo === '\n\n' ? LINE_PAUSE : CHAR_DELAY

    timerRef.current = setTimeout(() => {
      setDisplayedLen(prev => {
        // Skip over the \n\n as a unit
        if (fullText.slice(prev, prev + 2) === '\n\n') return prev + 2
        return prev + 1
      })
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [displayedLen, fullText])

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    playPop()
    setDisplayedLen(fullText.length)
    setDone(true)
  }

  // Split the currently-displayed text back into paragraphs
  const visibleText = fullText.slice(0, displayedLen)
  const paragraphs = visibleText.split('\n\n')

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      {/* Character + speech bubble row */}
      <div className="flex items-stretch gap-0 w-full">
        {/* Character image — stretches to match bubble height, no background */}
        <div className="flex-shrink-0 w-28 sm:w-36 flex items-end">
          <img
            src={MOOD_IMAGES[mood]}
            alt={`${mood} character`}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Speech bubble */}
        <div className="flex-1 relative rounded-2xl border-2 border-slate-300 bg-white p-4 sm:p-5 ml-2">
          {/* Bubble tail */}
          <div className="absolute left-[-10px] bottom-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-slate-300" />
          <div className="absolute left-[-7px] bottom-6 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[8px] border-r-white" />

          <div className="flex flex-col gap-2 min-h-[120px]">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {p}
                {/* Blinking cursor on the last paragraph while typing */}
                {i === paragraphs.length - 1 && !done && (
                  <span className="inline-block w-[2px] h-[1em] bg-slate-500 ml-0.5 align-middle animate-pulse" />
                )}
              </p>
            ))}
          </div>

          {/* Skip button (small, bottom-right of bubble) */}
          {!done && (
            <button
              onClick={handleSkip}
              className="absolute bottom-2 right-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Continue button — only appears when typing is done */}
      {done && (
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm animate-fade-in"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  )
}
