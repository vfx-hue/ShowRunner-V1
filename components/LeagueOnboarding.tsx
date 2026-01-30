import React, { useState } from 'react';
import { Plus, Hash, CheckCircle, Loader2, Calendar } from 'lucide-react';
import * as api from '../services/api';

interface LeagueOnboardingProps {
  userId: string;
  onLeagueSelected: (league: any) => void;
  existingLeagues: any[];
  isJoining: boolean;
}

const LeagueOnboarding: React.FC<LeagueOnboardingProps> = ({ userId, onLeagueSelected, existingLeagues, isJoining }) => {
  const [leagueName, setLeagueName] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectingLeagueId, setSelectingLeagueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTime) {
      setError("Please select a draft start time.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isoDate = new Date(draftTime).toISOString();
      const league = await api.createLeague(userId, leagueName, isoDate);
      onLeagueSelected(league);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const league = await api.joinLeague(userId, joinCode);
      setSuccess("Success! Loading league data...");
      setTimeout(() => {
        onLeagueSelected(league);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSelectLeague = async (league: any) => {
    setSelectingLeagueId(league.id);
    try {
      await onLeagueSelected(league);
    } finally {
      setSelectingLeagueId(null);
    }
  };

  const isDraftOver = (league: any) => {
    if (!league.draft_start_time) return false;
    const now = new Date();
    const draftTime = new Date(league.draft_start_time);
    // Rough heuristic: if it's been 12 hours since draft start, or if there's no code shown (meaning it might be established)
    // Actually, we'll just check if current time is after draft time.
    return now > draftTime;
  };

  const getWelcomeHero = () => {
    // Pick the most relevant league: active league or first one
    const activeLeagueId = localStorage.getItem('active_league_id');
    const heroLeague = existingLeagues.find(l => l.id === activeLeagueId) || existingLeagues[0];

    if (!heroLeague) return null;

    return (
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl mb-12 group">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest mb-4">
              <CheckCircle className="w-3 h-3" /> Welcome Back
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              Values Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Up 12%</span>
            </h2>
            <p className="opacity-60 font-medium text-lg max-w-lg leading-relaxed">
              You are currently ranked <span className="text-white font-bold">#{heroLeague.userRank}</span> in <span className="text-white font-bold">{heroLeague.name}</span>.
              The draft board is heating up.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-purple-300 mb-1">My Points</p>
              <p className="text-3xl font-black tracking-tight">{heroLeague.userPoints?.toLocaleString()}</p>
            </div>
            <button
              onClick={() => onLeagueSelected(heroLeague)}
              className="bg-white text-slate-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-50 transition-colors shadow-xl"
            >
              Enter League
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-purple-600/30 rounded-full blur-[80px] group-hover:bg-purple-600/40 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px]"></div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-6 pb-20">
      {getWelcomeHero()}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Leagues</h2>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
          {existingLeagues.length} Active
        </div>
      </div>

      {existingLeagues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {existingLeagues.map(l => {
            const draftOver = isDraftOver(l);
            return (
              <button
                key={l.id}
                onClick={() => handleSelectLeague(l)}
                disabled={!!selectingLeagueId || isJoining}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all text-left relative overflow-hidden group disabled:opacity-70 disabled:cursor-wait"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{l.name}</h3>
                  {draftOver && (
                    <div className="flex flex-col items-end">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest mb-1">Active</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">{l.userPoints?.toLocaleString() || 0} pts</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Rank #{l.userRank || '?'} of {l.totalTeams || '?'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top 3 Preview */}
                {l.top3 && l.top3.length > 0 && (
                  <div className="my-4 py-3 border-t border-b border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Leaderboard Preview</p>
                    <div className="space-y-1.5">
                      {l.top3.map((t: any, i: number) => (
                        <div key={t.user_id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                              {i + 1}
                            </span>
                            <span className="font-bold text-slate-700 truncate max-w-[120px]">
                              {t.profile?.display_name || 'Player'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-400">{t.adjusted_total_points.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end mt-4">
                  <div>
                    {!draftOver ? (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code: <span className="text-slate-900 font-mono">{l.code}</span></p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Season In Progress</p>
                    )}
                  </div>
                  {l.draft_start_time && (
                    <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1 rounded-xl border border-slate-100">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {new Date(l.draft_start_time).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {selectingLeagueId === l.id && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-all animate-fade-in">
                    <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Loading...</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create League */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg"><Plus className="w-6 h-6 text-purple-600" /></div>
            <h3 className="text-xl font-bold text-slate-900">Create a League</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">League Name</label>
              <input
                type="text"
                placeholder="e.g. The Office Pool"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Draft Start Time</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={draftTime}
                  onChange={e => setDraftTime(e.target.value)}
                  required
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isJoining}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading && !joinCode ? 'Creating...' : 'Create & Schedule Draft'}
            </button>
          </form>
        </div>

        {/* Join League */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2 rounded-lg"><Hash className="w-6 h-6 text-emerald-600" /></div>
            <h3 className="text-xl font-bold text-slate-900">Join a League</h3>
          </div>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invite Code</label>
              <input
                type="text"
                placeholder="Enter 6-Digit Code"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading || isJoining}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-[34px]"
            >
              {loading && joinCode ? 'Joining...' : 'Join League'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium animate-fade-in">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-center font-bold flex items-center justify-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
    </div>
  );
};

export default LeagueOnboarding;