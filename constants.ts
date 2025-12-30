import { Achievement, Difficulty } from './types';

export const DIFFICULTY_SETTINGS: Record<Difficulty, { holes: number; xpMultiplier: number }> = {
  Easy: { holes: 30, xpMultiplier: 1 },
  Medium: { holes: 40, xpMultiplier: 1.5 },
  Hard: { holes: 50, xpMultiplier: 2.5 },
  Expert: { holes: 58, xpMultiplier: 4 },
};

export const MAX_MISTAKES = 3;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    title: 'Beginner Luck',
    description: 'Complete your first Sudoku puzzle.',
    icon: '🏆',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Solve a puzzle in under 5 minutes.',
    icon: '⚡',
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete a puzzle with 0 mistakes.',
    icon: '💎',
  },
  {
    id: 'mastermind',
    title: 'Mastermind',
    description: 'Complete a Hard or Expert puzzle.',
    icon: '🧠',
  },
  {
    id: 'note_taker',
    title: 'Scholar',
    description: 'Use notes extensively in a game.',
    icon: '📝',
  },
];
