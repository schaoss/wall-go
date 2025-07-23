import { describe, it, expect, beforeEach } from 'vitest'
import { getTerritoryMap, detectTerritoryCapture, isInPureTerritory } from './territory'
import type { Cell, GameSnapshot } from '@/lib/types'

describe('getTerritoryMap', () => {
  it('one stone, fully walled, territory belongs to owner', () => {
    const N = 3
    const board: Cell[][] = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => ({
        stone: null,
        wallTop: null,
        wallLeft: null,
      })),
    )
    board[1][1].stone = 'R'
    board[1][1].wallTop = 'R'
    board[1][1].wallLeft = 'R'
    board[1][2].wallLeft = 'R'
    board[2][1].wallTop = 'R'
    const territory = getTerritoryMap(board)
    expect(territory[1][1]).toBe('R')
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (x === 1 && y === 1) continue
        expect(territory[y][x]).toBe(null)
      }
    }
  })

  it('two stones, two regions, both fully walled', () => {
    const N = 4
    const board: Cell[][] = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => ({
        stone: null,
        wallTop: null,
        wallLeft: null,
      })),
    )
    board[0][0].stone = 'R'
    board[0][0].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[1][0].wallTop = 'R'
    board[0][1].wallLeft = 'R'
    board[3][3].stone = 'B'
    board[3][3].wallLeft = 'B'
    board[3][3].wallTop = 'B'
    board[2][3].wallLeft = 'B'
    board[3][2].wallTop = 'B'
    const territory = getTerritoryMap(board)
    expect(territory[0][0]).toBe('R')
    expect(territory[3][3]).toBe('B')
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if ((x === 0 && y === 0) || (x === 3 && y === 3)) continue
        expect(territory[y][x]).toBe(null)
      }
    }
  })
})

describe('detectTerritoryCapture', () => {
  let mockGameState: GameSnapshot;
  
  beforeEach(() => {
    // Create a 3x3 board for testing
    const board: Cell[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => ({
        stone: null,
        wallTop: null,
        wallLeft: null,
      })),
    );
    
    mockGameState = {
      board,
      turn: 'R',
      selected: undefined,
      legal: new Set(),
      stepsTaken: 0,
      phase: 'playing',
      players: ['R', 'B'],
      stonesLimit: 2,
      stonesPlaced: { R: 2, B: 2, G: 0, Y: 0 },
      territoryMap: undefined,
      isLoading: false,
    };
  });
  
  it('should detect when territory is captured', () => {
    // Set up a board where R has a piece at [1,1]
    mockGameState.board[1][1].stone = 'R';
    
    // Add walls to create a territory
    mockGameState.board[1][1].wallTop = 'B';
    mockGameState.board[1][1].wallLeft = 'B';
    mockGameState.board[1][2].wallLeft = 'B';
    mockGameState.board[2][1].wallTop = 'B';
    
    // First detection - should not report capture since there's no previous map
    const result1 = detectTerritoryCapture(mockGameState);
    expect(result1.captured).toBe(false);
    expect(result1.territoryMap[1][1]).toBe('R');
    
    // Set the territory map - but manually create a version without the [0,0] territory
    const initialTerritoryMap = Array.from({ length: 3 }, () => Array(3).fill(null));
    initialTerritoryMap[1][1] = 'R'; // Only this cell is territory
    mockGameState.territoryMap = initialTerritoryMap;
    
    // Add another wall that doesn't change territory
    mockGameState.board[0][0].wallTop = 'R';
    
    // Second detection - should not report capture
    const result2 = detectTerritoryCapture(mockGameState);
    expect(result2.captured).toBe(false);
    
    // Now add walls that create a new territory at [0,0]
    mockGameState.board[0][0].wallLeft = 'R';
    mockGameState.board[0][1].wallLeft = 'R';
    mockGameState.board[1][0].wallTop = 'R';
    
    // Add a stone to make it a territory
    mockGameState.board[0][0].stone = 'R';
    
    // Third detection - should report capture
    const result3 = detectTerritoryCapture(mockGameState);
    expect(result3.captured).toBe(true);
    expect(result3.territoryMap[0][0]).toBe('R');
  });
});

describe('isInPureTerritory', () => {
  it('should return true when a piece is in territory owned by another player', () => {
    const N = 3;
    const board: Cell[][] = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => ({
        stone: null,
        wallTop: null,
        wallLeft: null,
      })),
    );
    
    // Set up a board where R has a piece at [1,1]
    board[1][1].stone = 'R';
    
    // Add walls to create B's territory
    board[1][1].wallTop = 'B';
    board[1][1].wallLeft = 'B';
    board[1][2].wallLeft = 'B';
    board[2][1].wallTop = 'B';
    
    // Manually set the territory map to simulate B's territory
    const territoryMap = Array.from({ length: 3 }, () => Array(3).fill(null));
    territoryMap[1][1] = 'B'; // Set the territory owner to B, not R
    
    const gameState: GameSnapshot = {
      board,
      turn: 'R',
      selected: undefined,
      legal: new Set(),
      stepsTaken: 0,
      phase: 'playing',
      players: ['R', 'B'],
      stonesLimit: 2,
      stonesPlaced: { R: 2, B: 2, G: 0, Y: 0 },
      territoryMap,
      isLoading: false,
    };
    
    // R's piece at [1,1] is in B's territory
    expect(isInPureTerritory({ x: 1, y: 1 }, gameState.territoryMap!, 'R')).toBe(true);
    
    // Change the territory owner to R
    gameState.territoryMap![1][1] = 'R';
    
    // R's piece at [1,1] is now in R's territory
    expect(isInPureTerritory({ x: 1, y: 1 }, gameState.territoryMap!, 'R')).toBe(false);
    
    // B's piece would be in R's territory
    expect(isInPureTerritory({ x: 1, y: 1 }, gameState.territoryMap!, 'B')).toBe(true);
  });
});
