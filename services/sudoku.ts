import { Difficulty, BoardData, CellData, DailyTask } from '../types';
import { DIFFICULTY_SETTINGS } from '../constants';

// --- Core Logic ---

const BLANK = 0;

export const getRow = (index: number) => Math.floor(index / 9);
export const getCol = (index: number) => index % 9;
export const getBox = (index: number) => {
  const row = getRow(index);
  const col = getCol(index);
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
};

// Seeded Random Number Generator
class Seeder {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  // Linear Congruential Generator
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const isValidPlacement = (grid: number[], index: number, num: number): boolean => {
  const row = getRow(index);
  const col = getCol(index);
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 9; i++) {
    // Check Row
    if (grid[row * 9 + i] === num && row * 9 + i !== index) return false;
    // Check Col
    if (grid[i * 9 + col] === num && i * 9 + col !== index) return false;
    // Check Box
    const boxIdx = (boxStartRow + Math.floor(i / 3)) * 9 + (boxStartCol + (i % 3));
    if (grid[boxIdx] === num && boxIdx !== index) return false;
  }
  return true;
};

// Backtracking solver
const solveGrid = (grid: number[], randomGen: () => number): boolean => {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === BLANK) {
      // Use the provided random generator for shuffling
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map(value => ({ value, sort: randomGen() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      for (const num of nums) {
        if (isValidPlacement(grid, i, num)) {
          grid[i] = num;
          if (solveGrid(grid, randomGen)) return true;
          grid[i] = BLANK;
        }
      }
      return false;
    }
  }
  return true;
};

// Generate a new puzzle
// seed is optional. If provided, generates the same puzzle for that seed.
export const generatePuzzle = (difficulty: Difficulty, seed?: string): { initial: number[]; solved: number[] } => {
  // Setup RNG
  let rng = Math.random;
  if (seed) {
    // Simple hash of string to number
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const seeder = new Seeder(Math.abs(hash));
    rng = () => seeder.next();
  }

  // 1. Create a full valid board
  const solved = new Array(81).fill(BLANK);
  solveGrid(solved, rng);
  
  // 2. Remove numbers based on difficulty
  const holes = DIFFICULTY_SETTINGS[difficulty].holes;
  const initial = [...solved];
  
  let attempts = holes;
  // Safety break
  let safety = 200;
  
  while (attempts > 0 && safety > 0) {
    const idx = Math.floor(rng() * 81);
    if (initial[idx] !== BLANK) {
      initial[idx] = BLANK;
      attempts--;
    }
    safety--;
  }
  
  return { initial, solved };
};

// Convert simple number array to BoardData object
export const createBoardData = (initial: number[]): BoardData => {
  return initial.map((num) => ({
    value: num,
    isFixed: num !== BLANK,
    notes: [],
    isError: false,
    isHinted: false,
  }));
};

// Check for errors on the board (conflicts)
export const checkErrors = (board: BoardData): BoardData => {
  const newBoard = [...board];
  const grid = newBoard.map(c => c.value);
  
  newBoard.forEach((cell, idx) => {
    if (cell.value !== BLANK && !cell.isFixed) {
       if (!isValidPlacement(grid, idx, cell.value)) {
         cell.isError = true;
       } else {
         cell.isError = false;
       }
    } else {
      cell.isError = false;
    }
  });
  return newBoard;
};

export const isSolved = (board: BoardData): boolean => {
  if (board.some(c => c.value === BLANK)) return false;
  const grid = board.map(c => c.value);
  for (let i = 0; i < 81; i++) {
    if (!isValidPlacement(grid, i, grid[i])) return false;
  }
  return true;
};

// Daily Tasks Generator
export const generateDailyTasks = (dateStr: string): DailyTask[] => {
  // Seed logic again
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const seeder = new Seeder(Math.abs(hash));
  const rng = () => seeder.next();

  const taskPool: Omit<DailyTask, 'id' | 'progress' | 'isCompleted'>[] = [
    { description: 'Place 10 correct numbers', target: 10, type: 'place_numbers' },
    { description: 'Place 20 correct numbers', target: 20, type: 'place_numbers' },
    { description: 'Complete 3 games', target: 3, type: 'play_games' },
    { description: 'Play a game without mistakes', target: 1, type: 'no_mistakes' },
    { description: 'Use 3 hints', target: 3, type: 'use_hints' },
  ];

  // Shuffle and pick 3
  const picked = taskPool
    .map(value => ({ value, sort: rng() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map(({ value }, idx) => ({
      ...value,
      id: `task_${dateStr}_${idx}`,
      progress: 0,
      isCompleted: false
    }));

  return picked;
};
