import { useState, useEffect } from 'react'
import { LearningRoadmap } from '@/components/LearningRoadmap'
import { getCompletedLevels, markLevelComplete } from '@/lib/roadmap-progress'
import { remoteGetCompletedLevels, remoteMarkLevelComplete } from '@/lib/supabaseApi'
import { useAuth } from '@/lib/auth'
import { DB_LEVELS, GAME_ID } from './data/roadmap'
import NormalizationLevel from './levels/NormalizationLevel'
import IndexingLevel from './levels/IndexingLevel'
import './DbQuest.css'

interface Props { onExit: () => void }

export default function DbQuest({ onExit }: Props) {
  const { userId } = useAuth()
  const [view, setView] = useState<'roadmap' | 'game'>('roadmap')
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(() => getCompletedLevels(GAME_ID))

  useEffect(() => {
    if (!userId) return
    remoteGetCompletedLevels(userId, GAME_ID).then(remote => {
      if (remote.size > 0) setCompletedIds(prev => new Set([...prev, ...remote]))
    })
  }, [userId])

  function handlePlay(idx: number) {
    setActiveLevelIdx(idx)
    setView('game')
  }

  function handleLevelComplete() {
    const levelId = DB_LEVELS[activeLevelIdx]?.id
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
