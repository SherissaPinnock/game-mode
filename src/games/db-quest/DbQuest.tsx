import { useState } from 'react'
import { LearningRoadmap } from '@/components/LearningRoadmap'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'
import { DB_LEVELS, GAME_ID } from './data/roadmap'
import NormalizationLevel from './levels/NormalizationLevel'
import IndexingLevel from './levels/IndexingLevel'
import './DbQuest.css'

interface Props { onExit: () => void }

export default function DbQuest({ onExit }: Props) {
  const [view, setView] = useState<'roadmap' | 'game'>('roadmap')
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(() => getCompletedLevels(GAME_ID))

  function handlePlay(idx: number) {
    setActiveLevelIdx(idx)
    setView('game')
  }

  function handleLevelComplete() {
    const levelId = DB_LEVELS[activeLevelIdx]?.id
    if (levelId) {
      markLevelComplete(GAME_ID, levelId)
      setCompletedIds(getCompletedLevels(GAME_ID))
    }
    setView('roadmap')
  }

  function handleBackToMap() {
    setView('roadmap')
  }

  if (view === 'roadmap') {
    return (
      <LearningRoadmap
        gameName="DB Quest"
        gameEmoji="🗄️"
        themeColor="#ffb703"
        completedIds={completedIds}
        levels={DB_LEVELS}
        onPlay={handlePlay}
        onExit={onExit}
      />
    )
  }

  if (activeLevelIdx === 0) {
    return <NormalizationLevel onComplete={handleLevelComplete} onBack={handleBackToMap} />
  }
  if (activeLevelIdx === 1) {
    return <IndexingLevel onComplete={handleLevelComplete} onBack={handleBackToMap} />
  }

  // Future levels — fallback
  return (
    <div className="dbq-coming-soon">
      <p>🚧 Level coming soon</p>
      <button onClick={handleBackToMap}>← Back to Map</button>
    </div>
  )
}
