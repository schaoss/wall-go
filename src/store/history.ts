import type { GameSnapshot, State } from '../lib/types'

export interface HistoryState {
  _history: GameSnapshot[]
  _future: GameSnapshot[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

export function createHistoryHandlers(
  get: () => State,
  set: (partial: Partial<State>) => void,
  snapshotFromState: (s: State) => GameSnapshot,
  restoreSnapshot: (s: GameSnapshot) => Partial<State>,
) {
  function pushHistory(snapshot: GameSnapshot) {
    set({
      _history: [...get()._history, snapshot],
      _future: [],
    })
  }
  function popHistory() {
    if (get()._history.length <= 1) return // Only allow undo if there is a previous state
    const history = get()._history
    const future = get()._future
    // Move the last snapshot to _future, restore the new last snapshot
    const prev = history[history.length - 2]
    const currentSnapshot = history[history.length - 1]
    set({
      ...restoreSnapshot(prev),
      _history: history.slice(0, -1),
      _future: [currentSnapshot, ...future],
    })
  }
  function popFuture() {
    if (get()._future.length === 0) return
    const next = get()._future[0]
    const currentSnapshot = snapshotFromState(get())
    set({
      ...restoreSnapshot(next),
      _history: [...get()._history, currentSnapshot],
      _future: get()._future.slice(1),
    })
  }
  return { pushHistory, popHistory, popFuture }
}
