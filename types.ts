export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface CellData {
  value: number;
  isFixed: boolean; // True if it was part of the initial puzzle
  notes: number[]; // For pencil marks
  isError: boolean; // True if conflicts with row/col/box
  isHinted?: boolean; // True if revealed by a hint
}

export type BoardData = CellData[];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number; // Timestamp
}

export interface DailyTask {
  id: string;
  description: string;
  target: number;
  progress: number;
  isCompleted: boolean;
  type: 'play_games' | 'place_numbers' | 'no_mistakes' | 'use_hints';
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  isDailyPuzzleSolved: boolean;
  tasks: DailyTask[];
}

export interface UserProfile {
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  bestTime: Record<Difficulty, number | null>; // In seconds
  totalXP: number;
  level: number;
  achievements: string[]; // List of unlocked achievement IDs
  dailyProgress?: DailyProgress;
}

export interface GameState {
  board: BoardData;
  initialBoard: number[]; // Simple array for reference
  solution: number[]; // For validation
  status: 'idle' | 'playing' | 'paused' | 'won' | 'lost';
  difficulty: Difficulty;
  mistakes: number;
  score: number;
  timer: number;
  selectedCellIndex: number | null;
  isNoteMode: boolean;
  history: BoardData[]; // For undo
  isDaily: boolean; // True if this is the daily challenge
}