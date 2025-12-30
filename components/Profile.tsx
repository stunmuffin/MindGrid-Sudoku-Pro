import React from 'react';
import { UserProfile, Achievement, Difficulty } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { Share2, Trophy, Clock, Target, Star } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onClose }) => {
  
  const handleShare = async () => {
    const text = `I've reached Level ${profile.level} in MindGrid Sudoku! 🧩\nGames Won: ${profile.gamesWon}\nXP: ${profile.totalXP}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MindGrid Sudoku Stats',
          text: text,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Stats copied to clipboard!');
    }
  };

  const getNextLevelXP = (level: number) => level * 1000;
  const progress = (profile.totalXP % 1000) / 1000 * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mb-3 border-2 border-white/50">
              👤
            </div>
            <h3 className="text-2xl font-bold">{profile.username}</h3>
            <p className="text-indigo-200 text-sm mb-4">Level {profile.level}</p>
            
            <div className="w-full bg-indigo-900/30 h-2 rounded-full overflow-hidden mb-1">
                <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between w-full text-xs text-indigo-200">
                <span>{profile.totalXP} XP</span>
                <span>Next: {getNextLevelXP(profile.level + 1)} XP</span>
            </div>
        </div>
        
        {/* Decor */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-24 h-24 bg-indigo-400 rounded-full opacity-50 blur-xl"></div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
             <Target className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
             <div className="text-2xl font-bold text-slate-800">{profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0}%</div>
             <div className="text-xs text-slate-500">Win Rate</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
             <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
             <div className="text-2xl font-bold text-slate-800">{profile.gamesWon}</div>
             <div className="text-xs text-slate-500">Games Won</div>
        </div>
      </div>

      {/* Best Times */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Best Times
        </h4>
        <div className="grid grid-cols-4 gap-2">
            {(Object.keys(profile.bestTime) as Difficulty[]).map(diff => (
                <div key={diff} className="flex flex-col items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{diff}</span>
                    <span className="text-sm font-medium text-slate-700">
                        {profile.bestTime[diff] ? `${Math.floor(profile.bestTime[diff]! / 60)}:${(profile.bestTime[diff]! % 60).toString().padStart(2, '0')}` : '-'}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Achievements ({profile.achievements.length}/{ACHIEVEMENTS.length})
        </h4>
        <div className="space-y-3">
            {ACHIEVEMENTS.map(ach => {
                const isUnlocked = profile.achievements.includes(ach.id);
                return (
                    <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isUnlocked ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
                        <div className="text-2xl">{ach.icon}</div>
                        <div>
                            <div className="font-medium text-slate-800 text-sm">{ach.title}</div>
                            <div className="text-xs text-slate-500">{ach.description}</div>
                        </div>
                        {isUnlocked && <div className="ml-auto text-amber-500"><Trophy size={16} /></div>}
                    </div>
                );
            })}
        </div>
      </div>

      <button 
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        <Share2 size={18} />
        Share Profile
      </button>
    </div>
  );
};

export default Profile;
