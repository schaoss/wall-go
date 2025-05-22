import { useGame } from './store'
import { checkGameEnd } from './utils/checkGameEnd'
import Board from './Board'

export default function App() {
  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, resetGame,
  } = useGame()

  const live = checkGameEnd(board, ['R','B'])

  return (
    <div className="flex flex-col items-center gap-4 py-6 min-h-screen bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 transition-all duration-500">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 drop-shadow mb-2 animate-fade-in">
        Wall Go · {phase === 'placing' ? '擺子階段' : `輪到 ${turn}`}
      </h1>

      <div className="flex gap-4 mb-2 animate-fade-in">
        {Object.entries(live.score ?? {}).map(([p,s]) => (
          <span key={p} className="font-mono text-lg px-2 py-1 rounded bg-white/70 shadow-sm border border-zinc-200 transition-all duration-300">
            {p}: {s}
          </span>
        ))}
      </div>

      {phase === 'playing' && skipReason === 'noMove' && (
        <div className="px-4 py-2 bg-yellow-200/80 rounded shadow animate-bounce-in">此玩家無合法行動，自動跳過！</div>
      )}
      {phase === 'playing' && skipReason === 'allBlocked' && (
        <div className="px-4 py-2 bg-yellow-200/80 rounded shadow animate-bounce-in">所有玩家皆無合法行動，遊戲結束條件 B！</div>
      )}

      {phase === 'finished' && result && (
        <div className="p-4 bg-amber-100/90 rounded-2xl shadow-lg mb-4 animate-fade-in flex flex-col items-center">
          <span className="text-xl font-bold mb-1">{result.tie ? '平局！' : `勝者：${result.winner}`}</span>
          <button onClick={resetGame} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300 animate-pop-in">
            再來一局
          </button>
        </div>
      )}

      <Board
        board={board}
        phase={phase}
        turn={turn}
        selected={selected ?? null}
        legal={legal}
        selectStone={selectStone}
        placeStone={placeStone}
        moveTo={moveTo}
        buildWall={buildWall}
      />
    </div>
  )
}
