interface ExitConfirmModalProps {
  /** If provided, shows "Save & Exit" button. If omitted, only "Quit" is available. */
  onSaveAndExit?: () => void
  onQuit: () => void
  onCancel: () => void
  progressLabel?: string
}

export function ExitConfirmModal({
  onSaveAndExit,
  onQuit,
  onCancel,
  progressLabel,
}: ExitConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 flex flex-col gap-5">
        {/* Icon + title */}
        <div className="text-center">
          <div className="text-4xl mb-3">🚪</div>
          <h2 className="text-lg font-bold text-slate-800">Exit game?</h2>
          {progressLabel ? (
            <p className="text-sm text-slate-500 mt-1">
              You're at <span className="font-semibold text-slate-700">{progressLabel}</span>.
              {onSaveAndExit
                ? ' Save your progress so you can pick up where you left off.'
                : ' Your progress will be lost.'}
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              {onSaveAndExit
                ? 'Save your progress so you can pick up where you left off.'
                : 'Your progress will be lost.'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onSaveAndExit && (
            <button
              onClick={onSaveAndExit}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              Save & Exit
            </button>
          )}
          <button
            onClick={onQuit}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors"
          >
            {onSaveAndExit ? 'Quit without saving' : 'Exit'}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel — keep playing
          </button>
        </div>
      </div>
    </div>
  )
}
