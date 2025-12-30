import React, { useMemo } from 'react';
import { BoardData, CellData } from '../types';
import { getRow, getCol, getBox } from '../services/sudoku';

interface BoardProps {
  board: BoardData;
  selectedIdx: number | null;
  onCellClick: (idx: number) => void;
}

const Board: React.FC<BoardProps> = ({ board, selectedIdx, onCellClick }) => {
  
  // Helpers to determine highlighting
  const getCellStatus = (index: number, cell: CellData) => {
    const isSelected = index === selectedIdx;
    
    let isRelated = false;
    let isSameValue = false;

    if (selectedIdx !== null) {
      const sRow = getRow(selectedIdx);
      const sCol = getCol(selectedIdx);
      const sBox = getBox(selectedIdx);
      
      const cRow = getRow(index);
      const cCol = getCol(index);
      const cBox = getBox(index);

      // Highlight row, col, box
      if (sRow === cRow || sCol === cCol || sBox === cBox) {
        isRelated = true;
      }
      
      // Highlight all cells with the same value (if value exists)
      const selectedVal = board[selectedIdx].value;
      if (selectedVal !== 0 && cell.value === selectedVal) {
        isSameValue = true;
      }
    }

    return { isSelected, isRelated, isSameValue };
  };

  return (
    <div className="w-full max-w-[450px] aspect-square p-1 sm:p-2 bg-slate-800 rounded-xl shadow-2xl mx-auto">
      <div className="grid grid-cols-9 w-full h-full gap-px bg-slate-400 border-2 border-slate-800 rounded-lg overflow-hidden">
        {board.map((cell, idx) => {
          const { isSelected, isRelated, isSameValue } = getCellStatus(idx, cell);
          
          // Determine borders for 3x3 boxes
          const col = idx % 9;
          const row = Math.floor(idx / 9);
          const borderRight = (col + 1) % 3 === 0 && col !== 8 ? 'border-r-2 border-slate-600' : '';
          const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? 'border-b-2 border-slate-600' : '';

          return (
            <div
              key={idx}
              onClick={() => onCellClick(idx)}
              className={`
                relative w-full h-full
                flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium cursor-pointer transition-colors duration-75 select-none
                ${borderRight} ${borderBottom}
                ${isSelected ? '!bg-indigo-600 text-white' : ''}
                ${!isSelected && isSameValue ? '!bg-indigo-200 text-slate-900' : ''}
                ${!isSelected && !isSameValue && isRelated ? 'bg-slate-100' : 'bg-white'}
                ${cell.isError && !isSelected ? '!bg-red-100 !text-red-600' : ''}
                ${cell.isHinted && !isSelected ? '!bg-amber-100 text-amber-800' : ''}
                ${cell.isFixed ? 'font-bold text-slate-900' : ''}
                ${!cell.isFixed && !isSelected ? 'text-indigo-600' : ''}
                active:bg-indigo-50
              `}
            >
              {cell.value !== 0 ? (
                cell.value
              ) : (
                <div className="grid grid-cols-3 w-full h-full p-[1px] sm:p-0.5 pointer-events-none">
                    {cell.notes.map(note => (
                        <div key={note} className="flex items-center justify-center text-[7px] sm:text-[9px] md:text-[10px] text-slate-500 leading-none">
                            {note}
                        </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
