import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart2, Plus, Play, ChevronLeft, Calendar, CheckSquare, Trophy, Star } from 'lucide-react';
import Board from './components/Board';
import Controls from './components/Controls';
import Modal from './components/Modal';
import Profile from './components/Profile';
import { BoardData, CellData, GameState, Difficulty, UserProfile, DailyTask } from './types';
import { generatePuzzle, createBoardData, isSolved, getRow, getCol, generateDailyTasks } from './services/sudoku';
import { DIFFICULTY_SETTINGS, MAX_MISTAKES } from './constants';

const INITIAL_PROFILE: UserProfile = {
  username: 'Player 1',
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: { Easy: null, Medium: null, Hard: null, Expert: null },
  totalXP: 0,
  level: 1,
  achievements: [],
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    initialBoard: [],
    solution: [],
    status: 'idle',
    difficulty: 'Easy',
    mistakes: 0,
    score: 0,
    timer: 0,
    selectedCellIndex: null,
    isNoteMode: false,
    history: [],
    isDaily: false
  });
  
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'success'} | null>(null);

  // --- Persistence & Initialization ---
  
  // Load profile and daily tasks
  useEffect(() => {
    const savedProfile = localStorage.getItem('sudoku_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      // Ensure dailyProgress exists
      const today = new Date().toISOString().split('T')[0];
      if (!parsed.dailyProgress || parsed.dailyProgress.date !== today) {
        parsed.dailyProgress = {
          date: today,
          isDailyPuzzleSolved: false,
          tasks: generateDailyTasks(today)
        };
      }
      setProfile(parsed);
    } else {
       const today = new Date().toISOString().split('T')[0];
       setProfile({
         ...INITIAL_PROFILE,
         dailyProgress: {
           date: today,
           isDailyPuzzleSolved: false,
           tasks: generateDailyTasks(today)
         }
       });
    }
  }, []);

  // Save profile on change
  useEffect(() => {
    if(profile.username !== 'Player 1' || profile.gamesPlayed > 0 || profile.dailyProgress) {
        localStorage.setItem('sudoku_profile', JSON.stringify(profile));
    }
  }, [profile]);

  // Timer
  useEffect(() => {
    let interval: number;
    if (gameState.status === 'playing') {
      interval = window.setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.status]);

  // Toast timeout
  useEffect(() => {
    if(toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Helper: Task Update ---
  const updateTasks = (type: DailyTask['type'], amount: number = 1) => {
    if (!profile.dailyProgress) return;
    
    let updated = false;
    const newTasks = profile.dailyProgress.tasks.map(task => {
        if (task.type === type && !task.isCompleted) {
            const newProgress = Math.min(task.target, task.progress + amount);
            if (newProgress !== task.progress) updated = true;
            return { 
                ...task, 
                progress: newProgress, 
                isCompleted: newProgress >= task.target 
            };
        }
        return task;
    });

    if (updated) {
        setProfile(prev => ({
            ...prev,
            dailyProgress: { ...prev.dailyProgress!, tasks: newTasks }
        }));
        
        // Check for newly completed tasks to show toast
        const justCompleted = newTasks.find((t, i) => t.isCompleted && !profile.dailyProgress!.tasks[i].isCompleted);
        if(justCompleted) {
            setToast({ msg: `Task Completed: ${justCompleted.description}`, type: 'success' });
        }
    }
  };


  // --- Logic ---

  const startNewGame = (difficulty: Difficulty, isDaily = false) => {
    let seed: string | undefined = undefined;
    if (isDaily) {
        const today = new Date().toISOString().split('T')[0];
        seed = today;
    }

    const { initial, solved } = generatePuzzle(difficulty, seed);
    const board = createBoardData(initial);
    
    setGameState({
      board,
      initialBoard: initial,
      solution: solved,
      status: 'playing',
      difficulty,
      mistakes: 0,
      score: 0,
      timer: 0,
      selectedCellIndex: null,
      isNoteMode: false,
      history: [],
      isDaily
    });
    
    // Update games played (only if not daily? let's count daily too)
    setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
    setIsNewGameOpen(false);
  };

  const updateBoard = useCallback((newBoard: BoardData, newMistakes: number) => {
    if (isSolved(newBoard)) {
        handleWin();
        setGameState(prev => ({
            ...prev,
            board: newBoard,
            mistakes: newMistakes,
            status: 'won',
            history: [...prev.history, prev.board]
        }));
    } else {
        setGameState(prev => ({
            ...prev,
            board: newBoard,
            mistakes: newMistakes,
            history: [...prev.history, prev.board],
            status: newMistakes >= MAX_MISTAKES ? 'lost' : 'playing'
        }));
    }
  }, []);

  const handleNumberInput = (num: number) => {
    if (gameState.status !== 'playing' || gameState.selectedCellIndex === null) return;
    
    const idx = gameState.selectedCellIndex;
    const currentCell = gameState.board[idx];
    
    if (currentCell.isFixed) return; 

    const newBoard = [...gameState.board];
    
    // Note Mode
    if (gameState.isNoteMode) {
      const notes = new Set(currentCell.notes);
      if (notes.has(num)) notes.delete(num);
      else notes.add(num);
      
      newBoard[idx] = { ...currentCell, value: 0, notes: Array.from(notes) };
      setGameState(prev => ({ ...prev, board: newBoard, history: [...prev.history, prev.board] }));
      return;
    }

    // Value Input
    const isCorrect = gameState.solution[idx] === num;
    
    if (isCorrect) {
      newBoard[idx] = { ...currentCell, value: num, notes: [], isError: false };
      
      // Clear notes in related
      const r = getRow(idx);
      const c = getCol(idx);
      const b = Math.floor(r/3)*3 + Math.floor(c/3);
      
      for(let i=0; i<81; i++) {
        const ir = getRow(i);
        const ic = getCol(i);
        const ib = Math.floor(ir/3)*3 + Math.floor(ic/3);
        if((ir === r || ic === c || ib === b) && newBoard[i].notes.includes(num)) {
             newBoard[i] = {...newBoard[i], notes: newBoard[i].notes.filter(n => n !== num)};
        }
      }

      updateTasks('place_numbers');
      updateBoard(newBoard, gameState.mistakes);
    } else {
        // Mistake
        const newMistakes = gameState.mistakes + 1;
        newBoard[idx] = { ...currentCell, value: num, isError: true }; 
        setGameState(prev => ({
            ...prev,
            board: newBoard,
            mistakes: newMistakes,
            history: [...prev.history, prev.board],
            status: newMistakes >= MAX_MISTAKES ? 'lost' : 'playing'
        }));
    }
  };

  const handleDelete = () => {
    if (gameState.status !== 'playing' || gameState.selectedCellIndex === null) return;
    const idx = gameState.selectedCellIndex;
    if (gameState.board[idx].isFixed) return;

    const newBoard = [...gameState.board];
    newBoard[idx] = { ...newBoard[idx], value: 0, notes: [], isError: false };
    setGameState(prev => ({ ...prev, board: newBoard, history: [...prev.history, prev.board] }));
  };

  const handleUndo = () => {
    if (gameState.history.length === 0 || gameState.status !== 'playing') return;
    const previousBoard = gameState.history[gameState.history.length - 1];
    setGameState(prev => ({
      ...prev,
      board: previousBoard,
      history: prev.history.slice(0, -1)
    }));
  };

  const handleToggleNote = () => {
    setGameState(prev => ({ ...prev, isNoteMode: !prev.isNoteMode }));
  };

  const handleNormalHint = () => {
    if (gameState.status !== 'playing') return;

    // 1. If cell selected, fill it
    // 2. If no cell selected, fill random empty cell
    
    let targetIdx = gameState.selectedCellIndex;
    
    // If no selection or selection is fixed/filled correctly, find a new target
    if (targetIdx === null || gameState.board[targetIdx].isFixed || gameState.board[targetIdx].value === gameState.solution[targetIdx]) {
        // Find first empty or error cell
        const emptyIndices = gameState.board
            .map((c, i) => (c.value === 0 || c.isError) ? i : -1)
            .filter(i => i !== -1);
        
        if (emptyIndices.length === 0) return; // Board full/solved
        
        // Pick one randomly or first
        targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        
        // Select it visually
        setGameState(prev => ({ ...prev, selectedCellIndex: targetIdx }));
    }

    // Apply hint
    const correctVal = gameState.solution[targetIdx];
    const newBoard = [...gameState.board];
    newBoard[targetIdx] = { 
        ...newBoard[targetIdx], 
        value: correctVal, 
        isFixed: false, 
        isError: false, 
        notes: [],
        isHinted: true 
    };

    updateTasks('use_hints');
    updateTasks('place_numbers'); // Technically placing a number
    
    setGameState(prev => ({
        ...prev,
        board: newBoard,
        history: [...prev.history, prev.board]
    }));
  };

  const handleWin = () => {
    const timeSpent = gameState.timer;
    const difficultyXP = DIFFICULTY_SETTINGS[gameState.difficulty].xpMultiplier * 100;
    const timeBonus = Math.max(0, 600 - timeSpent);
    let earnedXP = Math.floor(difficultyXP + timeBonus);
    
    if (gameState.isDaily) earnedXP *= 2; // Daily bonus

    // Update Daily Progress
    if (gameState.isDaily && profile.dailyProgress) {
        setProfile(prev => ({
            ...prev,
            dailyProgress: { ...prev.dailyProgress!, isDailyPuzzleSolved: true }
        }));
    }

    // Update Tasks
    updateTasks('play_games');
    if (gameState.mistakes === 0) updateTasks('no_mistakes');

    // Update Achievements
    const newAchievements = [...profile.achievements];
    if (!newAchievements.includes('first_win')) newAchievements.push('first_win');
    if (timeSpent < 300 && !newAchievements.includes('speed_demon')) newAchievements.push('speed_demon');
    if (gameState.mistakes === 0 && !newAchievements.includes('perfectionist')) newAchievements.push('perfectionist');
    if ((gameState.difficulty === 'Hard' || gameState.difficulty === 'Expert') && !newAchievements.includes('mastermind')) newAchievements.push('mastermind');

    setProfile(prev => {
        const newTotalXP = prev.totalXP + earnedXP;
        const newLevel = Math.floor(newTotalXP / 1000) + 1;
        const currentBest = prev.bestTime[gameState.difficulty];
        const newBest = currentBest === null ? timeSpent : Math.min(currentBest, timeSpent);

        return {
            ...prev,
            gamesWon: prev.gamesWon + 1,
            totalXP: newTotalXP,
            level: newLevel,
            achievements: newAchievements,
            bestTime: { ...prev.bestTime, [gameState.difficulty]: newBest }
        };
    });
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(gameState.status !== 'playing') return;
        
        const num = parseInt(e.key);
        if(!isNaN(num) && num >= 1 && num <= 9) {
            handleNumberInput(num);
        }
        if(e.key === 'Backspace' || e.key === 'Delete') handleDelete();
        if(e.key === 'n' || e.key === 'N') handleToggleNote();
        if(e.key === 'z' && (e.ctrlKey || e.metaKey)) handleUndo();
        if(e.key === 'h' || e.key === 'H') handleNormalHint();
        
        // Navigation
        if(gameState.selectedCellIndex !== null) {
            let next = gameState.selectedCellIndex;
            if(e.key === 'ArrowUp') next -= 9;
            if(e.key === 'ArrowDown') next += 9;
            if(e.key === 'ArrowLeft') next -= 1;
            if(e.key === 'ArrowRight') next += 1;
            
            // Boundary checks roughly
            if(next >= 0 && next < 81) {
                // Prevent wrapping left/right
                if (e.key === 'ArrowLeft' && gameState.selectedCellIndex % 9 === 0) return;
                if (e.key === 'ArrowRight' && (gameState.selectedCellIndex + 1) % 9 === 0) return;
                
                setGameState(p => ({...p, selectedCellIndex: next}));
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, gameState.selectedCellIndex, gameState.isNoteMode]);


  // Format Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeTasksCount = profile.dailyProgress?.tasks.filter(t => !t.isCompleted).length || 0;

  return (
    <div className="h-dvh flex flex-col items-center bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`px-4 py-2 rounded-lg shadow-lg text-white font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-slate-800'}`}>
                {toast.msg}
            </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-2 shadow-sm flex justify-between items-center shrink-0 z-30 h-14">
        {gameState.status === 'playing' ? (
           <>
             <button onClick={() => setGameState(p => ({...p, status: 'idle'}))} className="text-slate-500 hover:text-slate-800">
                <ChevronLeft size={24} />
             </button>
             <div className="flex flex-col items-center">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{gameState.isDaily ? 'Daily' : gameState.difficulty}</span>
                 <span className="text-lg font-mono font-bold text-slate-800 leading-none">{formatTime(gameState.timer)}</span>
             </div>
             <button onClick={() => setIsTasksOpen(true)} className="relative text-slate-500 hover:text-indigo-600">
                 <CheckSquare size={24} />
                 {activeTasksCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">{activeTasksCount}</span>}
             </button>
           </>
        ) : (
           <>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">M</div>
                <h1 className="text-lg font-bold text-slate-800">MindGrid</h1>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTasksOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                  <CheckSquare size={22} />
                  {activeTasksCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                  <BarChart2 size={22} />
                </button>
            </div>
           </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg flex flex-col relative overflow-hidden">
        
        {gameState.status === 'idle' ? (
           <div className="flex flex-col h-full p-6 overflow-y-auto">
              
              {/* Daily Challenge Card */}
              <div className="mb-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden shrink-0">
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Calendar size={24} className="text-white" />
                          </div>
                          {profile.dailyProgress?.isDailyPuzzleSolved && (
                              <div className="bg-green-500/20 text-green-100 text-xs font-bold px-2 py-1 rounded border border-green-500/50 flex items-center gap-1">
                                  <Trophy size={12} /> Solved
                              </div>
                          )}
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Daily Puzzle</h3>
                      <p className="text-indigo-200 text-sm mb-4">Solve today's seeded hard puzzle to earn double XP.</p>
                      
                      <button 
                        onClick={() => startNewGame('Hard', true)}
                        disabled={profile.dailyProgress?.isDailyPuzzleSolved}
                        className="w-full bg-white text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {profile.dailyProgress?.isDailyPuzzleSolved ? 'Completed' : 'Play Daily'}
                      </button>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              {/* Menu Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                  <button onClick={() => setIsNewGameOpen(true)} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group text-left">
                      <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                      </div>
                      <div className="font-bold text-slate-800">New Game</div>
                      <div className="text-xs text-slate-500">Classic Sudoku</div>
                  </button>
                  <button onClick={() => setIsTasksOpen(true)} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-amber-500 hover:shadow-md transition-all group text-left">
                      <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                          <Star size={24} />
                      </div>
                      <div className="font-bold text-slate-800">Tasks</div>
                      <div className="text-xs text-slate-500">Daily Missions</div>
                  </button>
              </div>

              {/* Stats Teaser */}
              <div className="mt-auto bg-slate-100 rounded-xl p-4 flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
                    {profile.level}
                 </div>
                 <div>
                    <div className="font-bold text-slate-800">Level {profile.level}</div>
                    <div className="text-xs text-slate-500">{profile.totalXP} Total XP</div>
                 </div>
                 <div className="ml-auto text-slate-400">
                    <BarChart2 size={20} />
                 </div>
              </div>
           </div>
        ) : (
           <div className="flex flex-col h-full">
             <div className="flex-1 flex flex-col justify-center py-2">
                 <Board 
                   board={gameState.board} 
                   selectedIdx={gameState.selectedCellIndex} 
                   onCellClick={(idx) => setGameState(p => ({...p, selectedCellIndex: idx}))} 
                 />
             </div>
             
             <div className="bg-white border-t border-slate-200 pb-safe">
                 <Controls 
                   onNumber={handleNumberInput}
                   onUndo={handleUndo}
                   onDelete={handleDelete}
                   onHint={handleNormalHint}
                   onToggleNote={handleToggleNote}
                   isNoteMode={gameState.isNoteMode}
                   mistakes={gameState.mistakes}
                   maxMistakes={MAX_MISTAKES}
                 />
             </div>
           </div>
        )}
      </main>

      {/* Modals */}
      
      {/* New Game Modal */}
      <Modal isOpen={isNewGameOpen} onClose={() => setIsNewGameOpen(false)} title="New Game">
        <div className="space-y-4">
          <p className="text-slate-600 mb-4">Select difficulty level.</p>
          <div className="grid grid-cols-1 gap-3">
             {(['Easy', 'Medium', 'Hard', 'Expert'] as Difficulty[]).map(diff => (
               <button
                 key={diff}
                 onClick={() => startNewGame(diff)}
                 className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
               >
                 <span className="font-medium text-slate-700 group-hover:text-indigo-700">{diff}</span>
                 <div className="flex gap-1">
                    {[...Array(DIFFICULTY_SETTINGS[diff].xpMultiplier < 2 ? 1 : DIFFICULTY_SETTINGS[diff].xpMultiplier < 3 ? 2 : 3)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500"></div>
                    ))}
                 </div>
               </button>
             ))}
          </div>
        </div>
      </Modal>

      {/* Tasks Modal */}
      <Modal isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} title="Daily Tasks">
         <div className="space-y-4">
            {profile.dailyProgress?.tasks.map(task => (
                <div key={task.id} className={`p-4 rounded-xl border flex items-center gap-4 ${task.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.isCompleted ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {task.isCompleted ? <Trophy size={16} /> : <Star size={16} />}
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium text-sm ${task.isCompleted ? 'text-green-800' : 'text-slate-700'}`}>{task.description}</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${task.isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${(task.progress / task.target) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                        {task.progress}/{task.target}
                    </div>
                </div>
            ))}
            <p className="text-xs text-center text-slate-400 mt-4">Tasks refresh daily at midnight.</p>
         </div>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Player Profile">
         <Profile profile={profile} onClose={() => setIsProfileOpen(false)} />
      </Modal>

      {/* Game Over / Win Modal */}
      {(gameState.status === 'won' || gameState.status === 'lost') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-in zoom-in-95">
              <div className="text-6xl mb-4">
                  {gameState.status === 'won' ? '🏆' : '😔'}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {gameState.status === 'won' ? 'Puzzle Solved!' : 'Game Over'}
              </h2>
              <p className="text-slate-500 mb-6">
                  {gameState.status === 'won' 
                    ? `Great job! You finished ${gameState.isDaily ? 'the Daily Challenge' : gameState.difficulty} in ${formatTime(gameState.timer)}.` 
                    : 'Too many mistakes. Don\'t give up!'}
              </p>
              
              <div className="space-y-3">
                <button 
                    onClick={() => {
                        setGameState(p => ({...p, status: 'idle'}));
                        setIsNewGameOpen(false);
                    }}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                    Back to Menu
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
