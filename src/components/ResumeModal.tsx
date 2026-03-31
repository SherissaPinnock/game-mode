import type { SavedGame } from '@/lib/resume'
import { timeAgo } from '@/lib/resume'

interface ResumeModalProps {
  gameTitle: string
  savedGame: SavedGame
  onResume: () => void
  onStartFresh: () => void
}

export function ResumeModal({ gameTitle, savedGame, onResume, onStartFresh }: ResumeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 flex flex-col gap-5">
        {/* Icon + title */}
        <div className="text-center">
          <div className="text-4xl mb-3">💾</div>
          <h2 className="text-lg font-bold text-slate-800">Continue {gameTitle}?</h2>
          <p className="text-sm text-slate-500 mt-1">
            You have saved progress from <span className="font-semibold text-slate-700">{timeAgo(savedGame.savedAt)}</span>.
          </p>
        </div>

        {/* Progress summary */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-center">
          <p className="text-xs text-indigo-500 uppercase tracking-wider font-semibold mb-0.5">Progress</p>
          <p className="text-base font-bold text-indigo-700">{savedGame.label}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
          >
            Continue where I left off
          </button>
          <button
            onClick={onStartFresh}
            className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            Start fresh
          </button>
        </div>
      </div>
    </div>
  )
}
