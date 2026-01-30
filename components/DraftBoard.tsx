import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show, Team, League } from '../types';
import { Star, Tv, Clock, Lock, Rocket, Filter, TrendingUp, Users, Trophy } from 'lucide-react';

interface DraftBoardProps {
  availableShows: Show[];
  currentTeam: Team | null;
  league: League | null;
  onDraft: (show: Show) => void;
  onShowClick: (show: Show) => void;
  isDrafting: boolean;
  isMyTurn?: boolean;
  currentDrafterName?: string;
  addsRemaining?: number;
  maxAdds?: number;
  viewMode?: 'draft' | 'waiver';
  cooldownExpiresAt?: number | null;
  picksUntilTurn?: number;
  lastPick?: any;
}

const DraftBoard: React.FC<DraftBoardProps> = ({
  availableShows,
  currentTeam,
  league,
  onDraft,
  onShowClick,
  isDrafting,
  isMyTurn = false,
  currentDrafterName,
  addsRemaining,
  maxAdds,
  viewMode = 'draft',
  cooldownExpiresAt = null,
  picksUntilTurn = 0,
  lastPick = null
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'hype' | 'viewers'>('hype');
  const [filterNetwork, setFilterNetwork] = useState<string>('All');
  const [timeLeft, setTimeLeft] = useState<string>('');

  React.useEffect(() => {
    if (!cooldownExpiresAt) {
      if (timeLeft) setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = cooldownExpiresAt - now;
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

  const networks = useMemo(() => {
    const netSet = new Set<string>();
    availableShows.forEach(s => netSet.add(s.network));
    return ['All', ...Array.from(netSet).sort()];
  }, [availableShows]);

  const filteredAndSortedShows = useMemo(() => {
    let result = [...availableShows];

    // Filter
    if (filterNetwork !== 'All') {
      result = result.filter(s => s.network === filterNetwork);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'hype') {
        const hypeA = a.hype || 0;
        const hypeB = b.hype || 0;
        if (hypeB !== hypeA) return hypeB - hypeA;
        return b.cumulativeRating - a.cumulativeRating;
      } else {
        if (b.cumulativeRating !== a.cumulativeRating) return b.cumulativeRating - a.cumulativeRating;
        return (b.hype || 0) - (a.hype || 0);
      }
    });

    return result;
  }, [availableShows, sortBy, filterNetwork]);

  const rosterStats = useMemo(() => {
    if (!currentTeam || !league) return null;
    const cableCount = currentTeam.roster.filter(s => s.category === 'cable').length;
    const streamingCount = currentTeam.roster.filter(s => s.category === 'streaming').length;
    const cableLimit = league.cable_slots || 3;
    const streamingLimit = league.streaming_slots || 3;

    return {
      cable: { current: cableCount, limit: cableLimit },
      streaming: { current: streamingCount, limit: streamingLimit },
      total: { current: cableCount + streamingCount, limit: cableLimit + streamingLimit }
    };
  }, [currentTeam, league]);

  return (
    <div className="premium-card bg-slate-900 border-indigo-500/20 p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-8">
        <div className="flex flex-col gap-2">
          {viewMode !== 'waiver' && (
            <>
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => navigate(`/league/${league?.id}`)}
                  className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest"
                >
                  ← Back to League
                </button>
              </div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                Draft Pool
                <span className="text-[10px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                  {filteredAndSortedShows.length} Shows
                </span>
              </h2>
              {rosterStats && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Users className="w-3.5 h-3.5" /> Roster Status
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${rosterStats.cable.current >= rosterStats.cable.limit ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      CABLE: {rosterStats.cable.current}/{rosterStats.cable.limit}
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${rosterStats.streaming.current >= rosterStats.streaming.limit ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      STREAM: {rosterStats.streaming.current}/{rosterStats.streaming.limit}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {viewMode === 'waiver' && (
            <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              Available Shows
              <span className="text-[10px] font-black bg-purple-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                {filteredAndSortedShows.length}
              </span>
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Sort Buttons */}
          <div className="flex bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-1">
            <button
              onClick={() => setSortBy('hype')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'hype' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Hype
            </button>
            <button
              onClick={() => setSortBy('viewers')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'viewers' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Viewers
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl px-4 py-2 hover:border-slate-600 transition-colors">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-slate-200 focus:ring-0 outline-none cursor-pointer"
            >
              {networks.map(net => (
                <option key={net} value={net} className="bg-slate-900 text-white font-bold">{net}</option>
              ))}
            </select>
          </div>

          {isDrafting && viewMode !== 'waiver' && (
            <div className={`
              px-6 py-3 rounded-2xl shadow-2xl transition-all duration-500 flex items-center gap-4 border
              ${isMyTurn
                ? 'bg-gradient-to-br from-green-500 to-emerald-700 border-green-400 scale-105'
                : 'bg-slate-800 border-slate-700'}
            `}>
              <div className={`relative ${isMyTurn ? 'animate-bounce' : ''}`}>
                <Clock className={`w-5 h-5 ${isMyTurn ? 'text-white' : 'text-slate-500'}`} />
                {isMyTurn && <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50 pulse"></div>}
              </div>
              <div>
                <span className={`block text-[9px] font-black uppercase tracking-[0.2em] ${isMyTurn ? 'text-green-100' : 'text-slate-500'}`}>
                  {isMyTurn ? "You're Up" : "On The Clock"}
                </span>
                <span className={`block font-black text-sm tracking-tight ${isMyTurn ? 'text-white' : 'text-slate-300'}`}>
                  {isMyTurn ? "YOUR TURN" : (currentDrafterName || 'Waiting...')}
                </span>
              </div>
            </div>
          )}

          {!isMyTurn && viewMode === 'draft' && picksUntilTurn > 0 && (
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Picks Until Your Turn</span>
                <span className="block font-black text-sm text-white">{picksUntilTurn}</span>
              </div>
            </div>
          )}

          {lastPick && viewMode === 'draft' && (
            <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500">Last Pick</span>
                <span className="block font-bold text-xs text-white truncate max-w-[100px]">{lastPick.show_name}</span>
              </div>
            </div>
          )}

          {viewMode === 'draft' && addsRemaining !== undefined && (
            <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500">Adds Remaining</span>
                <span className="block font-bold text-xs text-white">{addsRemaining}/{maxAdds}</span>
              </div>
            </div>
          )}

          {viewMode === 'waiver' && timeLeft && (
            <div className="bg-purple-900/30 border border-purple-500/30 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 animate-pulse">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-purple-300">
                  Cooldown Remaining
                </span>
                <span className="block font-black text-sm text-white tracking-widest">
                  {timeLeft}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'waiver' ? (
        <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-800/80 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Series</th>
                <th className="px-8 py-5 text-center">Platform</th>
                <th className="px-8 py-5 text-center">Market Power</th>
                <th className="px-8 py-5 text-right">Draft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAndSortedShows.map((show) => (
                <tr key={show.id} className="hover:bg-slate-800/50 transition-all duration-300 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      {show.posterUrl && (
                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                          <img src={show.posterUrl} alt={show.title} className="w-12 h-16 object-cover rounded-lg shadow-xl" />
                          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg"></div>
                        </div>
                      )}
                      <div>
                        <div className="font-black text-white text-lg group-hover:text-purple-400 transition-colors tracking-tight">{show.title}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{show.category} Content</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-700 tracking-wider">
                      {show.network}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 font-black text-white">
                      {show.cumulativeRating > 0 ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-base">{(show.cumulativeRating / 1000000).toFixed(1)}M</span>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Viewers</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-purple-400">
                          <div className="flex items-center gap-1.5">
                            <Rocket className="w-4 h-4" />
                            <span className="text-base">{show.hype}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Hype Score</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => onDraft(show)}
                      disabled={!isDrafting || !isMyTurn}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black py-3 px-8 rounded-2xl shadow-xl shadow-purple-900/30 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      Assign to Team
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar-dark p-2">
          {filteredAndSortedShows.map((show) => {
            return (
              <div
                key={show.id}
                className="group relative h-[380px] bg-slate-800 rounded-3xl overflow-hidden hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)] transition-all duration-500 active:scale-[0.98]"
              >
                {/* Poster Image Area */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => onShowClick(show)}
                >
                  {show.posterUrl && show.posterUrl.startsWith('http') ? (
                    <img
                      src={show.posterUrl}
                      alt={show.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600 p-8 text-center">
                      <Tv className="w-12 h-12 mb-4 opacity-20" />
                      <span className="text-sm font-black uppercase tracking-widest">{show.title}</span>
                    </div>
                  )}

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10 tracking-widest ${show.category === 'streaming' ? 'bg-indigo-600 text-white' : 'bg-orange-600 text-white'}`}>
                      {show.category.toUpperCase()}
                    </span>
                  </div>

                  {/* Rating / Hype */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl px-2.5 py-1.5 rounded-2xl border border-white/5 shadow-2xl">
                    {show.cumulativeRating > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Rocket className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="text-xs font-black text-white">
                      {show.cumulativeRating > 0
                        ? `${(show.cumulativeRating / 1000000).toFixed(1)}M`
                        : (show.hype || '0')}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">{show.network}</span>
                      <h3 className="text-xl font-black text-white leading-tight transition-transform duration-300 group-hover:-translate-y-1">{show.title}</h3>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onDraft(show); }}
                      disabled={!isDrafting || !isMyTurn}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform flex items-center justify-center gap-3
                        ${isDrafting && isMyTurn
                          ? 'bg-white text-slate-900 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)] hover:bg-purple-100'
                          : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}
                    >
                      {isDrafting && isMyTurn ? (
                        addsRemaining !== undefined ? 'Claim Series' : 'Draft Series'
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Locked
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Draft Complete Overlay */}
      {!isDrafting && viewMode === 'draft' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in pointer-events-none">
          <div className="bg-white rounded-[4rem] p-16 text-center shadow-[0_0_100px_-20px_rgba(139,92,246,0.5)] animate-bounce-in max-w-xl pointer-events-auto border-[16px] border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
                <Trophy className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic leading-none">
                Draft <br /> <span className="text-purple-600">Complete</span>
              </h2>
              <p className="text-xl text-slate-500 font-bold mb-10 leading-relaxed px-4">Your legendary roster has been assembled. It's time to win the season.</p>
              <button
                onClick={() => navigate(`/league/${league?.id}`)}
                className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] text-xl hover:bg-purple-600 transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-3"
              >
                ENTER ARENA <Rocket className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftBoard;