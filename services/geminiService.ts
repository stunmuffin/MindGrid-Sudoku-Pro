import { GoogleGenAI } from "@google/genai";
import { BoardData, CellData } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIHint = async (board: BoardData, selectedIndex: number): Promise<string> => {
  // Convert board to a readable string format for the AI
  const boardStr = board.map(c => c.value === 0 ? '.' : c.value).join('');
  const row = Math.floor(selectedIndex / 9) + 1;
  const col = (selectedIndex % 9) + 1;

  const prompt = `
    You are a Sudoku Grandmaster.
    Here is the current Sudoku board state (row-major, '.' is empty):
    ${boardStr}

    The user is stuck at Row ${row}, Column ${col} (index ${selectedIndex}).
    
    1. Analyze the board.
    2. Explain the logical step to determine the number for this specific cell OR give a hint about a different cell if this one is not yet solvable logically.
    3. Keep the explanation concise (max 2 sentences).
    4. Do not just give the number if possible, explain the "Why". If it's a "Naked Single" or "Hidden Single", say so.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Could not generate a hint.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I couldn't analyze the board right now. Check your internet connection.";
  }
};