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

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4 pb-20">
      <h2 className="text-4xl font-black text-slate-900 mb-2 text-center tracking-tight">Your Leagues</h2>
      <p className="text-slate-500 text-center mb-10 font-medium">Select a league to manage your roster or join the draft.</p>

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