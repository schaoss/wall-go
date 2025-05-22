import { BOARD_SIZE, type Player } from './lib/types'
import { useGame } from './store'
import clsx from 'clsx' // Tailwind
import { checkGameEnd } from './utils/checkGameEnd'

const color = (p: Player) => (p === 'R' ? 'bg-rose-500' : 'bg-indigo-500')

export default function App() {
  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, resetGame,
  } = useGame()

  const live = checkGameEnd(board, ['R','B'])

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h1 className="text-xl font-bold">
        Wall Go · {phase === 'placing' ? '擺子階段' : `輪到 ${turn}`}
      </h1>

      <div className="flex gap-4 mb-2">
        {Object.entries(live.score ?? {}).map(([p,s]) => (
          <span key={p} className="font-mono">{p}: {s}</span>
        ))}
      </div>

      {phase === 'playing' && skipReason === 'noMove' && (
        <div className="px-4 py-2 bg-yellow-200 rounded">此玩家無合法行動，自動跳過！</div>
      )}
      {phase === 'playing' && skipReason === 'allBlocked' && (
        <div className="px-4 py-2 bg-yellow-200 rounded">所有玩家皆無合法行動，遊戲結束條件 B！</div>
      )}

      {phase === 'finished' && result && (
        <div className="p-4 bg-amber-100 rounded shadow mb-4">
          {result.tie ? '平局！' : `勝者：${result.winner}`}<br/>
          分數：{Object.entries(result.score ?? {}).map(([p,s]) => `${p}:${s}`).join('  ')}
          <button onClick={resetGame} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded">
            再來一局
          </button>
        </div>
      )}

      <div className="border-4 border-zinc-500 inline-block max-w-[800px] w-full aspect-square">
        <div
          className={clsx(
            'grid',
            `grid-cols-${BOARD_SIZE}`,
            `grid-rows-${BOARD_SIZE}`
          )}
        >
          {board.map((row, y) =>
            row.map((cell, x) => {
              const posKey = `${x},${y}`
              const isSel = selected?.x === x && selected?.y === y
              return (
                <div key={posKey} className="relative aspect-square border border-zinc-300">
                  {/* 牆 */}
                  {cell.wallTop && <div className={clsx('absolute left-0 top-0 h-1 w-full', color(cell.wallTop))} />}
                  {cell.wallLeft && <div className={clsx('absolute left-0 top-0 w-1 h-full', color(cell.wallLeft))} />}

                  {/* 石子 */}
                  {cell.stone && (
                    <button
                      className={clsx('absolute inset-[15%] rounded-full', color(cell.stone),
                        isSel && 'ring-2 ring-amber-400')}
                      onClick={() => phase === 'playing' && selectStone({ x, y })}
                    />
                  )}

                  {/* 擺子階段空格 */}
                  {!cell.stone && phase === 'placing' && (
                    <button
                      className="absolute inset-0 hover:bg-amber-100/40"
                      onClick={() => placeStone({ x, y })}
                    />
                  )}

                  {/* 合法移動格 */}
                  {legal.has(posKey) && (
                    <button
                      className="absolute inset-0 bg-emerald-400/20 hover:bg-emerald-400/40"
                      onClick={() => moveTo({ x, y })}
                    />
                  )}

                  {/* 建牆按鈕（若此格被選中） */}
                  {isSel && (
                    <>
                      {/* TOP wall button */}
                      {y > 0 && !cell.wallTop && (
                        <button
                          onClick={() => buildWall({ x, y }, 'top')}
                          className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-6 rounded bg-gray-500/60 hover:bg-rose-500"
                        />
                      )}
                      {/* LEFT wall button */}
                      {x > 0 && !cell.wallLeft && (
                        <button
                          onClick={() => buildWall({ x, y }, 'left')}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded bg-gray-500/60 hover:bg-rose-500"
                        />
                      )}
                      {x < BOARD_SIZE - 1 && !board[y][x + 1].wallLeft && (
                        <button
                          onClick={() => buildWall({ x, y }, 'right')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded bg-gray-500/60 hover:bg-rose-500"
                        />
                      )}
                      {y < BOARD_SIZE - 1 && !board[y + 1][x].wallTop && (
                        <button
                          onClick={() => buildWall({ x, y }, 'bottom')}
                          className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1.5 w-6 rounded bg-gray-500/60 hover:bg-rose-500"
                        />
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}