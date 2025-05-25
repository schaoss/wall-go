import { useEffect, useRef, useState, useCallback } from 'react'
import Board from './components/Board/Board'
import GameStatus from './components/ui/GameStatus'
import { useGame } from './store/index'
import { checkGameEnd } from './utils/checkGameEnd'
import { PLAYER_LIST } from './lib/types'
import GameButton from './components/ui/GameButton'
import Navbar from './components/ui/Navbar'
import Footer from './components/ui/Footer'
import GameModeMenu from './components/ui/GameModeMenu'
import ConfirmDialog from './components/ui/ConfirmDialog'
import RuleDialog from './components/ui/RuleDialog'
import { TurnManager } from './agents/TurnManager'
import { HumanAgent, RandomAiAgent, MinimaxAiAgent, KillerAgent } from './agents'
import type { PlayerAction } from './lib/types'
import type { Player } from './lib/types'

type GameMode = 'pvp' | 'ai'
type AiSide = 'R' | 'B'

export default function App() {
  const [showRule, setShowRule] = useState(false)
  const [mode, setMode] = useState<GameMode | null>(null)
  const [aiSide, setAiSide] = useState<AiSide>('B')

  // --- AI 難度狀態 ---
  const [aiLevel, setAiLevel] = useState<'random' | 'minimax' | 'killer'>('killer')

  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, setPhase, resetGame,
    undo, redo, canUndo, canRedo,
    stepsTaken,
    setHumanSide,
  } = useGame()

  const live = checkGameEnd(board, [...PLAYER_LIST])

  // 深色模式切換
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  const [showConfirm, setShowConfirm] = useState(false)
  const handleHome = () => {
    if ((canUndo || canRedo) && (phase !== 'finished')) {
      setShowConfirm(true)
      return
    }
    setMode(null)
    resetGame()
    setPhase('selecting')
  }

  // --- 代理主流程整合 ---
  const turnManagerRef = useRef<TurnManager | null>(null)
  const humanAgentRef = useRef<HumanAgent | null>(null)

  // 狀態快照（只給 TurnManager 用）
  type GameStateRef = {
    board: typeof board
    turn: typeof turn
    selected: typeof selected
    legal: typeof legal
    stepsTaken: number
    phase: typeof phase
    players: Player[]
    stonesLimit: number
    stonesPlaced: Record<Player, number>
    result: typeof result
    skipReason: typeof skipReason
  }
  const latestStateRef = useRef<GameStateRef | null>(null)
  useEffect(() => {
    latestStateRef.current = {
      board,
      turn,
      selected,
      legal,
      stepsTaken,
      phase,
      players: [...PLAYER_LIST],
      stonesLimit: 4,
      stonesPlaced: { R: 0, B: 0, ...Object.fromEntries(PLAYER_LIST.map(p => [p, 0])) },
      result,
      skipReason,
    }
  }, [board, turn, selected, legal, stepsTaken, phase, result, skipReason])

  const turnManagerStartedRef = useRef(false)

  const setupTurnManager = useCallback(() => {
    if (!mode) return
    const human = new HumanAgent()
    humanAgentRef.current = human
    // 根據 aiLevel 決定 AI agent
    const aiMap = {
      random: RandomAiAgent,
      minimax: MinimaxAiAgent,
      killer: KillerAgent
    }
    const ai = new aiMap[aiLevel]()
    const agents: Record<Player, import('./agents/PlayerAgent').PlayerAgent> =
      mode === 'ai'
        ? (aiSide === 'R' ? { R: ai, B: human } : { R: human, B: ai })
        : { R: human, B: human }
    turnManagerRef.current = new TurnManager({
      agents,
      getGameState: () => latestStateRef.current!,
      applyAction: async (action: PlayerAction) => {
        if (action.type === 'place') {
          placeStone(action.pos)
        } else if (action.type === 'move') {
          if (action.from) selectStone(action.from)
          moveTo(action.pos)
        } else if (action.type === 'wall' && action.dir) {
          if (action.from) selectStone(action.from)
          buildWall(action.pos, action.dir)
        }
      },
      isGameOver: (state) => state.phase === 'finished' || !!state.result,
    })
    turnManagerStartedRef.current = false // 每次 setup 都重設 flag
  }, [mode, aiSide, aiLevel, buildWall, moveTo, placeStone, selectStone])

  // 初始化 TurnManager 與代理組合（mode/aiSide 變動時重建）
  useEffect(() => {
    if (!mode) return
    setupTurnManager()
  }, [mode, aiSide, setupTurnManager])

  // phase 進入 placing 或 playing 時才啟動主循環
  useEffect(() => {
    if (!turnManagerRef.current) return
    if ((phase === 'placing' || phase === 'playing') && !turnManagerStartedRef.current) {
      turnManagerRef.current.startLoop()
      turnManagerStartedRef.current = true
    }
  }, [phase])

  // 玩家互動：不判斷回合，直接送入 humanAgent
  const handlePlayerAction = useCallback((action: PlayerAction) => {
    humanAgentRef.current?.submitAction(action)
  }, [])

  // 選擇模式畫面
  if (phase === 'selecting') {
    return (
      <GameModeMenu
        setMode={m => {
          setMode(m)
          setPhase('placing')
          if (m === 'ai') {
            setHumanSide(aiSide === 'R' ? 'B' : 'R')
          } else {
            setHumanSide(null)
          }
        }}
        setAiSide={setAiSide}
        setAiLevel={setAiLevel}
      />
    )
  }

  // 判斷目前回合是否真人（僅用於 UI 是否啟用互動）
  const isHumanTurn = turnManagerRef.current?.['agents']?.[turn] instanceof HumanAgent

  return (
    <>
      <div
        className={[
          'flex flex-col items-center gap-4 py-4 min-h-dvh min-w-0',
          'bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900',
          'transition-all duration-500',
          'box-border',
          'p-4',
        ].join(' ')}
        style={{
          maxWidth: '100vw',
          minHeight: '100dvh',
          paddingBottom: '80px',
        }}
      >
        <Navbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          phase={phase}
          onHome={handleHome}
          onToggleDark={() => setDark(d => !d)}
          dark={dark}
        />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in flex items-center gap-2">
          {phase === 'finished' && result ? (
            result.tie ? (
              <>平手！</>
            ) : result.winner ? (
              <>
                勝者：
                <span
                  className={
                    result.winner === 'R'
                      ? 'inline-block w-6 h-6 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mx-1 align-middle'
                      : 'inline-block w-6 h-6 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mx-1 align-middle'
                  }
                  aria-label={result.winner === 'R' ? '紅方' : '藍方'}
                />
              </>
            ) : null
          ) : (
            <>Wall Go · {phase === 'placing' ? '擺子階段' : phase === 'playing' ? '行動階段' : '結算階段'}</>
          )}
        </h1>
        <div className="flex gap-4 mb-2 animate-fade-in items-center">
          {(phase === 'placing'
            ? PLAYER_LIST.map(p => [p, 0])
            : Object.entries(live.score ?? {}))
          .map(([p, s]) => (
            <span
              key={p}
              className="flex items-center gap-2 font-mono text-lg px-2 py-1 rounded bg-white/70 dark:bg-zinc-800/80 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300"
            >
              <span
                className={
                  p === 'R'
                    ? 'inline-block w-5 h-5 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mr-1'
                    : 'inline-block w-5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mr-1'
                }
                aria-label={p === 'R' ? '紅方' : '藍方'}
              />
              {s}
            </span>
          ))}
          {phase === 'finished' && (
            <GameButton
              onClick={() => {
                setMode(null)
                resetGame()
                setPhase('selecting')
              }}
              ariaLabel="再玩一次"
              className="!bg-emerald-200/80 !dark:bg-emerald-900/80 !hover:bg-emerald-400/80 !dark:hover:bg-emerald-800/95 !text-emerald-900 !dark:text-emerald-100 !border-emerald-300 !dark:border-emerald-700 shadow-lg"
            >再玩一次</GameButton>
          )}
        </div>
        <GameStatus phase={phase} skipReason={skipReason ?? null} />
        <Board
          board={board}
          phase={phase}
          turn={turn}
          selected={selected ?? null}
          legal={legal}
          placeStone={phase === 'placing' ? (pos => handlePlayerAction({ type: 'place', pos })) : (isHumanTurn ? (pos => handlePlayerAction({ type: 'place', pos })) : undefined)}
          selectStone={isHumanTurn && phase === 'playing' ? (pos => selectStone(pos)) : undefined}
          moveTo={isHumanTurn && phase === 'playing' ? (pos => handlePlayerAction({ type: 'move', pos })) : undefined}
          buildWall={isHumanTurn && phase === 'playing' ? ((pos, dir) => handlePlayerAction({ type: 'wall', pos, dir })) : undefined}
        />
        <div className="w-full flex justify-center my-3 animate-fade-in">
          <GameButton onClick={() => setShowRule(true)} text ariaLabel="遊戲規則說明">
            遊戲規則說明
          </GameButton>
        </div>
      </div>
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
      <Footer />
      <ConfirmDialog
        open={showConfirm}
        title="回到首頁"
        message={
          '遊戲尚未結束，確定要回到首頁嗎？\n目前進度將會消失。'
        }
        confirmText="確定"
        cancelText="取消"
        onConfirm={() => {
          setShowConfirm(false)
          setMode(null)
          resetGame()
          setPhase('selecting')
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
