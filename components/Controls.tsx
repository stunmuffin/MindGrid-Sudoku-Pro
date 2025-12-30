import React from 'react';
import { Eraser, Undo, Lightbulb, Pencil } from 'lucide-react';

interface ControlsProps {
  onNumber: (num: number) => void;
  onUndo: () => void;
  onDelete: () => void;
  onHint: () => void;
  onToggleNote: () => void;
  isNoteMode: boolean;
  mistakes: number;
  maxMistakes: number;
}

const Controls: React.FC<ControlsProps> = ({
  onNumber,
  onUndo,
  onDelete,
  onHint,
  onToggleNote,
  isNoteMode,
  mistakes,
  maxMistakes
}) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto mt-2 sm:mt-4 px-4 pb-4">
      
      {/* Mistake Counter & Status */}
      <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm font-medium">
        <span>Mistakes: <span className={`${mistakes >= maxMistakes - 1 ? 'text-red-500' : 'text-slate-900'}`}>{mistakes}/{maxMistakes}</span></span>
        <span className="text-slate-400">Controls</span>
      </div>

      {/* Action Tools */}
      <div className="grid grid-cols-4 gap-3">
        <button onClick={onUndo} className="flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl bg-white shadow-sm border border-slate-100 active:bg-slate-50 text-slate-600 transition-transform active:scale-95 touch-manipulation">
          <Undo size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Undo</span>
        </button>
        <button onClick={onDelete} className="flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl bg-white shadow-sm border border-slate-100 active:bg-slate-50 text-slate-600 transition-transform active:scale-95 touch-manipulation">
          <Eraser size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Erase</span>
        </button>
        <button 
          onClick={onToggleNote} 
          className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl shadow-sm border transition-transform active:scale-95 touch-manipulation relative ${isNoteMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-600'}`}
        >
          <Pencil size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Notes</span>
          {isNoteMode && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white"></div>}
        </button>
        <button 
          onClick={onHint} 
          className="flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl bg-white shadow-sm border border-slate-100 active:bg-slate-50 text-amber-500 transition-transform active:scale-95 touch-manipulation"
        >
          <Lightbulb size={20} />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Hint</span>
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2 mt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onNumber(num)}
            className="aspect-[4/5] sm:aspect-square flex items-center justify-center text-2xl sm:text-2xl font-semibold bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shadow-sm hover:bg-indigo-100 active:bg-indigo-200 transition-transform active:scale-90 touch-manipulation border-b-2 border-indigo-100 active:border-b-0 active:translate-y-0.5"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Controls;
