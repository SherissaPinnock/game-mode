import { useEffect, useState } from 'react'

import { LearningRoadmap } from '@/components/LearningRoadmap'
import { useAuth } from '@/lib/auth'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'
import { remoteGetCompletedLevels, remoteMarkLevelComplete } from '@/lib/supabaseApi'

import {
  GAME_BOY_CONCEPT_LESSONS,
  GAME_BOY_LEVELS,
  GAME_ID,
  type GameBoyConceptLevelId,
} from './data/roadmap'
import { BuildPullRunLevel } from './levels/BuildPullRunLevel'
import { ConceptQuizLevel } from './levels/ConceptQuizLevel'
import { DockerfileAssemblyLevel } from './levels/DockerfileAssemblyLevel'
import { IntroLevel } from './levels/IntroLevel'
import './GameBoy.css'

interface GameBoyProps {
  onExit: () => void
}

export default function GameBoy({ onExit }: GameBoyProps) {
  const { userId } = useAuth()
  const [view, setView] = useState<'roadmap' | 'game'>('roadmap')
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(() => getCompletedLevels(GAME_ID))

  useEffect(() => {
    if (!userId) return

    remoteGetCompletedLevels(userId, GAME_ID).then((remote) => {
      if (remote.size > 0) setCompletedIds((current) => new Set([...current, ...remote]))
    })
  }, [userId])

  function handlePlay(levelIdx: number) {
    setActiveLevelIdx(levelIdx)
    setView('game')
  }

  function handleLevelComplete() {
    const levelId = GAME_BOY_LEVELS[activeLevelIdx]?.id
    if (levelId) {
      markLevelComplete(GAME_ID, levelId)
      const updated = getCompletedLevels(GAME_ID)
      setCompletedIds(updated)
      if (userId) remoteMarkLevelComplete(userId, GAME_ID, levelId, updated)
    }

    setView('roadmap')
  }

  function handleBackToMap() {
    setView('roadmap')
  }

  if (view === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="Docker Game Boy"
        gameEmoji="🐳"
        themeColor="#2fb6ff"
        completedIds={completedIds}
        levels={GAME_BOY_LEVELS}
        onPlay={handlePlay}
        onExit={onExit}
      />
    )
  }

  const activeLevel = GAME_BOY_LEVELS[activeLevelIdx]

  if (activeLevel?.id === 'images') {
    return <IntroLevel onBack={handleBackToMap} onComplete={handleLevelComplete} />
  }

  if (activeLevel?.id === 'dockerfiles') {
    return (
      <DockerfileAssemblyLevel
        levelNumber={activeLevelIdx + 1}
        onBack={handleBackToMap}
        onComplete={handleLevelComplete}
      />
    )
  }

  if (activeLevel?.id === 'build-pull-run') {
    return (
      <BuildPullRunLevel
        levelNumber={activeLevelIdx + 1}
        onBack={handleBackToMap}
        onComplete={handleLevelComplete}
      />
    )
  }

  const lesson = GAME_BOY_CONCEPT_LESSONS[activeLevel.id as GameBoyConceptLevelId]

  if (lesson) {
    return (
      <ConceptQuizLevel
        levelNumber={activeLevelIdx + 1}
        title={activeLevel.title}
        subtitle={activeLevel.subtitle}
        lesson={lesson}
        onBack={handleBackToMap}
        onComplete={handleLevelComplete}
      />
    )
  }

  return null
}
