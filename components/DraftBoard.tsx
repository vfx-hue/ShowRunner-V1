import React, { useMemo, useState } from 'react';
import { Show, Team, League } from '../types';
import { Star, Tv, Clock, Lock, Rocket, Filter, ArrowUpAz, TrendingUp, Users } from 'lucide-react';

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
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6">
        <div className="flex flex-col gap-1">
          {viewMode !== 'waiver' && (
            <>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Draft Pool
                <span className="text-xs font-medium bg-slate-700 text-slate-400 px-2 py-1 rounded-full border border-slate-600">
                  {filteredAndSortedShows.length} Available
                </span>
              </h2>
              {rosterStats && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Users className="w-3 h-3" /> My Roster:
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rosterStats.cable.current >= rosterStats.cable.limit ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      CABLE: {rosterStats.cable.current}/{rosterStats.cable.limit}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rosterStats.streaming.current >= rosterStats.streaming.limit ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      STREAM: {rosterStats.streaming.current}/{rosterStats.streaming.limit}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {viewMode === 'waiver' && (
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Available Shows
              <span className="text-xs font-medium bg-slate-700 text-slate-400 px-2 py-1 rounded-full border border-slate-600">
                {filteredAndSortedShows.length}
              </span>
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter */}
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 min-w-[140px]">
            {/* kept filter select */}
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-300 focus:ring-0 outline-none cursor-pointer w-full"
            >
              {networks.map(net => (
                <option key={net} value={net} className="bg-slate-800 text-white">{net}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 min-w-[140px]">
            <ArrowUpAz className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold text-slate-300 focus:ring-0 outline-none cursor-pointer w-full"
            >
              <option value="hype" className="bg-slate-800 text-white">Sort by Hype</option>
              <option value="viewers" className="bg-slate-800 text-white">Sort by Viewers</option>
            </select>
          </div>

          {isDrafting && viewMode !== 'waiver' && (
            <div className={`
              px-4 py-2 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-3
              ${isMyTurn
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-900/40 animate-pulse'
                : 'bg-slate-700 border border-slate-600'}
            `}>
              <Clock className={`w-4 h-4 ${isMyTurn ? 'text-white' : 'text-slate-400'}`} />
              <div>
                <span className={`block text-[8px] font-bold uppercase tracking-wider ${isMyTurn ? 'text-green-100' : 'text-slate-400'}`}>
                  {isMyTurn ? "You're Up" : "On The Clock"}
                </span>
                <span className={`block font-black text-sm ${isMyTurn ? 'text-white' : 'text-slate-200'}`}>
                  {isMyTurn ? "YOUR TURN" : (currentDrafterName || 'Waiting...')}
                </span>
              </div>
            </div>
          )}

          {!isMyTurn && viewMode === 'draft' && picksUntilTurn > 0 && (
            <div className="bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl flex items-center gap-3">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Picks Until Your Turn</span>
                <span className="block font-black text-sm text-white">{picksUntilTurn}</span>
              </div>
            </div>
          )}

          {lastPick && viewMode === 'draft' && (
            <div className="bg-slate-900/30 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500">Last Pick</span>
                <span className="block font-bold text-xs text-white truncate max-w-[100px]">{lastPick.show_name}</span>
              </div>
            </div>
          )}


          {viewMode === 'draft' && addsRemaining !== undefined && (
            <div className={`bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3`}>
              <TrendingUp className={`w-4 h-4 text-purple-400`} />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Weekly Adds
                </span>
                <span className="block font-black text-sm text-white">
                  {addsRemaining} / {maxAdds || 3} Left
                </span>
              </div>
            </div>
          )}

          {viewMode === 'waiver' && timeLeft && (
            <div className="bg-slate-900/50 border border-purple-500/50 bg-purple-900/20 px-4 py-2 rounded-xl flex items-center gap-3">
              <Clock className="w-4 h-4 text-purple-300" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-purple-200">
                  Waiver Cooldown
                </span>
                <span className="block font-black text-sm text-white">
                  {timeLeft}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'waiver' ? (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-black tracking-wider">
              <tr>
                <th className="px-6 py-4">Show Details</th>
                <th className="px-6 py-4 text-center">Network</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAndSortedShows.map((show) => (
                <tr key={show.id} className="hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {show.posterUrl && (
                        <img src={show.posterUrl} alt={show.title} className="w-10 h-14 object-cover rounded shadow-md" />
                      )}
                      <div>
                        <div className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">{show.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{show.category === 'streaming' ? 'Streaming' : 'Cable'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-600">
                      {show.network}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-mono font-black text-slate-200">
                      {show.cumulativeRating > 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          {show.cumulativeRating.toLocaleString()}
                        </>
                      ) : (
                        <>
                          <Rocket className="w-3.5 h-3.5 text-purple-400" />
                          {show.hype}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDraft(show)}
                      disabled={!isDrafting || !isMyTurn}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Claim
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredAndSortedShows.map((show) => {
            return (
              <div
                key={show.id}
                className="group relative bg-slate-700 border border-slate-600 rounded-xl overflow-hidden hover:shadow-2xl hover:border-slate-500 transition-all duration-300 flex flex-col"
              >
                {/* Poster Image Area - Clickable */}
                <div
                  className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden"
                  onClick={() => onShowClick(show)}
                >
                  {show.posterUrl && show.posterUrl.startsWith('http') ? (
                    <img
                      src={show.posterUrl}
                      alt={show.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-600 text-slate-400 p-4 text-center">
                      <Tv className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-bold">{show.title}</span>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>

                  {/* Top Badge: Category */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${show.category === 'streaming' ? 'bg-indigo-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {show.category === 'streaming' ? 'STREAM' : 'CABLE'}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {(show.cumulativeRating > 0 ? show.hype : show.imdbRating) && (
                    <div className={`absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold ${show.cumulativeRating > 0 ? 'text-purple-400' : 'text-yellow-400'}`}>
                      {show.cumulativeRating > 0 ? <Rocket className="w-3 h-3 fill-current" /> : <Star className="w-3 h-3 fill-current" />}
                      {show.cumulativeRating > 0 ? show.hype : show.imdbRating}
                    </div>
                  )}

                  {/* Bottom Info on Image */}
                  <div className="absolute bottom-0 left-0 w-full p-3">
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md truncate">{show.title}</h3>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-xs text-slate-300 font-medium bg-white/10 px-1.5 rounded backdrop-blur-md">{show.network}</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                        {show.cumulativeRating > 0
                          ? `${(show.cumulativeRating / 1000000).toFixed(1)}M`
                          : (
                            <>
                              <Rocket className="w-3 h-3" /> {show.hype || '0'}
                            </>
                          )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Area */}
                <div className="p-3 bg-slate-800 border-t border-slate-700">
                  <button
                    onClick={() => onDraft(show)}
                    disabled={!isDrafting || !isMyTurn}
                    className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all transform active:scale-95 flex items-center justify-center gap-2
                    ${isDrafting && isMyTurn
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}`}
                  >
                    {isDrafting && isMyTurn ? (
                      addsRemaining !== undefined ? 'Add' : 'Draft'
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        {!isDrafting ? 'View' : 'Wait'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Draft Complete Overlay */}
      {!isDrafting && viewMode === 'draft' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in pointer-events-none">
          <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl animate-bounce-in max-w-lg pointer-events-auto border-8 border-purple-100">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic">DRAFT COMPLETE!</h2>
            <p className="text-xl text-slate-500 font-medium mb-8">Your roster is locked in. Let the season begin!</p>
            <button
              onClick={() => window.location.href = '/'} // Redirect to dashboard
              className="bg-slate-900 text-white font-black px-10 py-5 rounded-2xl text-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              GO TO DASHBOARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftBoard;