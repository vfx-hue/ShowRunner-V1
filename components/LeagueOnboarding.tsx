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

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Your Leagues</h2>

      {existingLeagues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {existingLeagues.map(l => (
            <button 
              key={l.id}
              onClick={() => onLeagueSelected(l)}
              disabled={isJoining}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all text-left relative overflow-hidden group disabled:opacity-70 disabled:cursor-wait"
            >
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{l.name}</h3>
              <div className="flex justify-between items-end mt-2">
                <p className="text-sm text-slate-500">Code: {l.code}</p>
                {l.draft_start_time && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                    {new Date(l.draft_start_time).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {isJoining && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
              )}
            </button>
          ))}
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