import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Game from './components/Game'
import { useGame } from './store/index'
import { checkGameEnd } from './utils/checkGameEnd'
import { PLAYER_LIST } from './lib/types'
import Footer from './components/ui/Footer'
import GameModeMenu from './components/ui/GameModeMenu'
import ConfirmDialog from './components/ui/ConfirmDialog'
import RuleDialog from './components/ui/RuleDialog'
import { TurnManager } from './agents/TurnManager'
import { HumanAgent, RandomAiAgent, MinimaxAiAgent, KillerAgent } from './agents'
import type { PlayerAction } from './lib/types'
import type { Player } from './lib/types'
import SeoHelmet from './components/SeoHelmet'

type GameMode = 'pvp' | 'ai'
type AiSide = 'R' | 'B'

export default function App() {
  const { t } = useTranslation()

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
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
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

  // 判斷目前回合是否真人（僅用於 UI 是否啟用互動）
  const isHumanTurn = turnManagerRef.current?.['agents']?.[turn] instanceof HumanAgent

  return (
    <>
      <SeoHelmet />
      {phase === 'selecting' ? (
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
          setShowRule={setShowRule}
        />
      ) : (
        <Game
          board={board}
          phase={phase}
          turn={turn}
          selected={selected ?? null}
          legal={legal}
          result={result ?? null}
          live={live}
          canUndo={canUndo}
          canRedo={canRedo}
          undo={undo}
          redo={redo}
          handleHome={handleHome}
          dark={dark}
          setDark={setDark}
          isHumanTurn={isHumanTurn}
          handlePlayerAction={handlePlayerAction}
          selectStone={selectStone}
          resetGame={resetGame}
          setMode={setMode}
          setPhase={setPhase}
          setShowRule={setShowRule}
        />
      )}
      <Footer />
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
      <ConfirmDialog
        open={showConfirm}
        title={t('menu.home', '回到首頁')}
        message={
          t('menu.confirmHome', '遊戲尚未結束，確定要回到首頁嗎？\n目前進度將會消失。')
        }
        confirmText={t('common.confirm', '確定')}
        cancelText={t('common.cancel', '取消')}
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
