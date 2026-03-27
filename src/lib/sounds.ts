import correctSrc from '@/assets/sounds/correct sound.mp3'
import wrongSrc from '@/assets/sounds/wrong sound.mp3'
import arrowSrC from '@/assets/sounds/arrow.mp3'
import clickSrc from '@/assets/sounds/click.mp3'
import popSrc from '@/assets/sounds/pop sound.mp3'
import introSrc from '@/assets/sounds/intro.mp3'
import serverSrc from '@/assets/sounds/server crash.mp3'
import gameOverSrc from '@/assets/sounds/game over.mp3'
import warningSrc from '@/assets/sounds/warning sound 2.mp3'
import completeSrc from '@/assets/sounds/complete sound.mp3'
import nextLevelSrc from '@/assets/sounds/next level.mp3'
import voiceOverSrc from '@/assets/sounds/tutorial voice over.mp3'
/**
 * Play a short sound effect. Creates a fresh Audio each time
 * so overlapping plays don't cut each other off.
 */
function play(src: string) {
  const audio = new Audio(src)
  audio.volume = 0.5
  audio.play().catch(() => {
    // Browser may block autoplay before user interaction — silently ignore
  })
}

export function playCorrect() {
  play(correctSrc)
}

export function playWrong() {
  play(wrongSrc)
}

export function playArrow() {
  play(arrowSrC)
}

export function playClick() {
  play(clickSrc)
}

export function playPop() {
  play(popSrc)
}

export function playIntro() {
  play(introSrc)
}

export function playServerCrash() {
  play(serverSrc)
}

export function playGameOver() {
  play(gameOverSrc)
}

export function playWarning() {
  play(warningSrc)
}

export function playComplete() {
  play(completeSrc)
}

export function playNextLevel() {
  play(nextLevelSrc)
}

export function playVoiceOver() {
  play(voiceOverSrc)
}