// src/agents/AIWorker.ts
import type { GameSnapshot, PlayerAction, Player, Cell } from '../lib/types';
import {
  reachable, cloneGameState, applyAction, getLegalActions, getRandomAction,
  getBestPlacement, getReachableSet, isSuicideMove, scoreAction,
} from '../utils/ai';
import { minimax as minimaxUtil, selectBestPlacingAction as selectMinimaxBestPlacingActionUtil } from '../utils/minimaxHelpers';

const N_CONST = 7; // Board size for Zobrist etc.

// --- Devil AI Logic (Adapted from former DevilWorker.ts) ---
const DEVIL_MAX_THINKING_TIME = 2000;
const zobristStoneDevil: bigint[][][] = [...Array(N_CONST)].map(() => [...Array(N_CONST)].map(() => [rand64Devil(), rand64Devil()]));
const zobristWallLeftDevil: bigint[][] = [...Array(N_CONST)].map(() => [...Array(N_CONST)].map(rand64Devil));
const zobristWallTopDevil: bigint[][] = [...Array(N_CONST)].map(() => [...Array(N_CONST)].map(rand64Devil));

function rand64Devil(): bigint {
  return BigInt.asUintN(64, BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
}

function hashBoardDevil(board: Cell[][]): string {
  let h = 0n;
  for (let y = 0; y < N_CONST; y++) {
    for (let x = 0; x < N_CONST; x++) {
      const c = board[y][x];
      if (c.stone === 'R') h ^= zobristStoneDevil[y][x][0];
      if (c.stone === 'B') h ^= zobristStoneDevil[y][x][1];
      if (c.wallLeft) h ^= zobristWallLeftDevil[y][x];
      if (c.wallTop) h ^= zobristWallTopDevil[y][x];
    }
  }
  return h.toString();
}

interface TTEntryDevil { depth: number; value: number }
const TT_DEVIL = new Map<string, TTEntryDevil>();

function stoneLibertiesDevil(board: Cell[][], x: number, y: number): number {
  let lib = 0;
  if (x < N_CONST - 1 && !board[y][x + 1].wallLeft && !board[y][x + 1].stone) lib++;
  if (x > 0 && !board[y][x].wallLeft && !board[y][x - 1].stone) lib++;
  if (y < N_CONST - 1 && !board[y + 1][x].wallTop && !board[y + 1][x].stone) lib++;
  if (y > 0 && !board[y][x].wallTop && !board[y - 1][x].stone) lib++;
  return lib;
}

function totalLibDevil(board: Cell[][], p: Player) {
  let sum = 0;
  for (let y = 0; y < N_CONST; y++)
    for (let x = 0; x < N_CONST; x++)
      if (board[y][x].stone === p) sum += stoneLibertiesDevil(board, x, y);
  return sum;
}

function evalStateDevil(state: GameSnapshot, me: Player): number {
  const opp: Player = me === 'R' ? 'B' : 'R';
  const board = state.board;
  const reachScore = (reachable(board, me) - reachable(board, opp)) * 8;
  const libScore = (totalLibDevil(board, opp) - totalLibDevil(board, me)) * 6;
  let iso = 0;
  for (let y = 0; y < N_CONST; y++)
    for (let x = 0; x < N_CONST; x++)
      if (board[y][x].stone === opp && stoneLibertiesDevil(board, x, y) === 0) iso += 50;
  let selfCritical = 0;
  for (let y = 0; y < N_CONST; y++) {
    for (let x = 0; x < N_CONST; x++) {
      if (board[y][x].stone === me) {
        const l = stoneLibertiesDevil(board, x, y);
        if (l === 1) selfCritical += 40;
        if (l === 0) selfCritical += 120;
      }
    }
  }
  const myReachableCells = getReachableSet(board, me);
  const oppReachableCells = getReachableSet(board, opp);
  let myPotentialTerritoryCount = 0;
  for (const cellString of myReachableCells) {
    if (!oppReachableCells.has(cellString)) myPotentialTerritoryCount++;
  }
  let oppPotentialTerritoryCount = 0;
  for (const cellString of oppReachableCells) {
    if (!myReachableCells.has(cellString)) oppPotentialTerritoryCount++;
  }
  const POTENTIAL_TERRITORY_WEIGHT = 4;
  const potentialTerritoryValue = (myPotentialTerritoryCount - oppPotentialTerritoryCount) * POTENTIAL_TERRITORY_WEIGHT;
  return reachScore + libScore + iso - selfCritical + potentialTerritoryValue;
}

function actionHeuristicDevil(state: GameSnapshot, action: PlayerAction, me: Player) {
  const board = state.board;
  const beforeReach = reachable(board, me);
  const beforeLib = totalLibDevil(board, me);
  const after = applyAction(cloneGameState(state), action);
  const afterReach = reachable(after.board, me);
  if (afterReach === 0) return -Infinity;
  const afterLib = totalLibDevil(after.board, me);
  let score = evalStateDevil(after, me);
  const selfReachLoss = Math.max(0, beforeReach - afterReach);
  const selfLibLoss = Math.max(0, beforeLib - afterLib);
  score -= 12 * selfReachLoss;
  score -= 8 * selfLibLoss;
  return score;
}

function calculateDevilPlayingMove(state: GameSnapshot, legalActions: PlayerAction[]): PlayerAction {
  const start = performance.now();
  let best: PlayerAction | null = null;
  let depth = 1;
  TT_DEVIL.clear();
  while (performance.now() - start < DEVIL_MAX_THINKING_TIME) {
    const { action } = searchRootDevil(state, depth, start, DEVIL_MAX_THINKING_TIME);
    if (action) best = action;
    if (performance.now() - start >= DEVIL_MAX_THINKING_TIME && best) break;
    depth++;
    if (depth > 20) break; // Safety break
  }
  return best ?? getRandomAction({ legalActions })!;
}

function searchRootDevil(state: GameSnapshot, depth: number, t0: number, limit: number) {
  let bestVal = -Infinity;
  let best: PlayerAction | null = null;
  const me = state.turn;
  const moves = getLegalActions(state).sort((a, b) => actionHeuristicDevil(state, b, me) - actionHeuristicDevil(state, a, me));
  for (const action of moves) {
    if (performance.now() - t0 > limit && best !== null) break;
    const child = applyAction(cloneGameState(state), action);
    const val = -alphaBetaDevil(child, depth - 1, -Infinity, Infinity, me, t0, limit);
    if (val > bestVal) {
      bestVal = val;
      best = action;
    }
  }
  return { action: best, value: bestVal };
}

function alphaBetaDevil(state: GameSnapshot, depth: number, alpha: number, beta: number, me: Player, t0: number, limit: number): number {
  if (performance.now() - t0 > limit) return evalStateDevil(state, me);
  const key = hashBoardDevil(state.board);
  const tt = TT_DEVIL.get(key);
  if (tt && tt.depth >= depth) return tt.value;
  if (depth === 0 || state.phase !== 'playing') return evalStateDevil(state, me);
  let val = -Infinity;
  const moves = getLegalActions(state).sort((a, b) => actionHeuristicDevil(state, b, me) - actionHeuristicDevil(state, a, me));
  if (moves.length === 0) return evalStateDevil(state, me);
  for (const action of moves) {
    const child = applyAction(cloneGameState(state), action);
    val = Math.max(val, -alphaBetaDevil(child, depth - 1, -beta, -alpha, me, t0, limit));
    alpha = Math.max(alpha, val);
    if (alpha >= beta) break;
  }
  TT_DEVIL.set(key, { depth, value: val });
  return val;
}

// --- Minimax AI Logic ---
const MINIMAX_DEPTH = 2;
function calculateMinimaxPlayingMove(gameState: GameSnapshot, legalActions: PlayerAction[]): PlayerAction {
  const safeActions = legalActions.filter(a => !isSuicideMove(gameState, a, gameState.turn));
  const candidateActions = safeActions.length > 0 ? safeActions : legalActions;
  if (candidateActions.length === 0) return getRandomAction({ legalActions })!; // Should not happen if legalActions is not empty

  let bestScore = -Infinity;
  let bestActions: PlayerAction[] = [];
  for (const action of candidateActions) {
    const score = minimaxUtil(applyAction(cloneGameState(gameState), action), MINIMAX_DEPTH - 1, false, gameState.turn);
    if (score > bestScore) {
      bestScore = score;
      bestActions = [action];
    } else if (score === bestScore) {
      bestActions.push(action);
    }
  }
  return getRandomAction({ legalActions: bestActions.length > 0 ? bestActions : legalActions })!;
}

// --- Killer AI Logic ---
function calculateKillerPlayingMove(gameState: GameSnapshot, legalActions: PlayerAction[]): PlayerAction {
  const safeActions = legalActions.filter(a => !isSuicideMove(gameState, a, gameState.turn));
  const candidateActions = safeActions.length > 0 ? safeActions : legalActions;
  if (candidateActions.length === 0) return getRandomAction({ legalActions })!; // Should not happen

  let bestScore = -Infinity;
  let bestActions: PlayerAction[] = [];
  for (const action of candidateActions) {
    const currentScore = scoreAction(gameState, action, gameState.turn);
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestActions = [action];
    } else if (currentScore === bestScore) {
      bestActions.push(action);
    }
  }
  return getRandomAction({ legalActions: bestActions.length > 0 ? bestActions : legalActions })!;
}

// --- Worker message handler ---
self.onmessage = (event: MessageEvent<{ aiType: string; gameState: GameSnapshot }>) => {
  const { aiType, gameState } = event.data;
  let action: PlayerAction | null = null;

  try {
    const legalActions = getLegalActions(gameState);

    // Handle case where game is finished first
    if (gameState.phase === 'finished') {
      self.postMessage({ action: null, info: 'Game finished, no action taken.' });
      return;
    }

    if (legalActions.length === 0) {
      self.postMessage({ error: 'No legal actions available but game is not finished.' });
      return;
    }

    if (gameState.phase === 'placing') {
      const placementActions = legalActions.filter(a => a.type === 'place');
      if (placementActions.length === 0) { // Should ideally not happen if legalActions is not empty
        self.postMessage({ error: 'No legal placement actions available in placing phase.' });
        return;
      }
      switch (aiType) {
        case 'devil':
        case 'killer':
          action = getBestPlacement(gameState);
          break;
        case 'minimax':
          action = selectMinimaxBestPlacingActionUtil(gameState, placementActions);
          break;
        case 'random':
        default:
          action = getRandomAction({ legalActions: placementActions })!;
          break;
      }
    } else if (gameState.phase === 'playing') {
      switch (aiType) {
        case 'devil':
          action = calculateDevilPlayingMove(gameState, legalActions);
          break;
        case 'killer':
          action = calculateKillerPlayingMove(gameState, legalActions);
          break;
        case 'minimax':
          action = calculateMinimaxPlayingMove(gameState, legalActions);
          break;
        case 'random':
        default:
          action = getRandomAction({ legalActions })!;
          break;
      }
    } else {
      // Fallback for unexpected phase, though 'finished' is handled above
      self.postMessage({ error: `Unexpected game phase: ${gameState.phase}` });
      return;
    }

    if (action) {
      self.postMessage({ action });
    } else {
      // If action is null here, it implies an issue in decision logic for non-finished phases
      // or a specific AI logic failed to return an action.
      // As a robust fallback, if legal actions were available, pick a random one.
      self.postMessage({ action: getRandomAction({ legalActions })!, info: "Fell back to random action." });
    }

  } catch (e) {
    self.postMessage({ error: (e as Error).message, stack: (e as Error).stack });
  }
};
