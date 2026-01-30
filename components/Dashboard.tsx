import React from 'react';
import { Settings, Activity } from 'lucide-react';
import { Team } from '../types';

interface DashboardProps {
  teams: Team[];
  onSelectLeague: () => void;
  recentPicks: any[];
  currentUserId: string;
  showCooldown?: boolean;
  league?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ teams, onSelectLeague, recentPicks, currentUserId, showCooldown, league }) => {
  // Sort teams by points
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);
  const myTeam = teams.find(t => t.id === currentUserId);

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-8 animate-fade-in-up px-4">
      {/* Hero / Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">Welcome Back!</h2>
          <p className="opacity-80 font-medium mb-6">You're currently in <span className="text-purple-300 font-bold">{league?.name || 'The League'}</span></p>

          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 min-w-[140px]">
              <p className="text-[10px] uppercase font-bold tracking-widest text-purple-300 mb-1">My Rank</p>
              <p className="text-2xl font-black">#{sortedTeams.findIndex(t => t.id === currentUserId) + 1}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 min-w-[140px]">
              <p className="text-[10px] uppercase font-bold tracking-widest text-purple-300 mb-1">Points</p>
              <p className="text-2xl font-black">{myTeam ? myTeam.totalPoints.toFixed(1) : '0.0'}</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* League Standings Card */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Standings
            </h3>
          </div>
          <button
            onClick={onSelectLeague}
            className="text-xs font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors"
          >
            Manage League
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {sortedTeams.map((team, idx) => (
            <div
              key={team.id}
              onClick={onSelectLeague}
              className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="text-xs font-black text-slate-300 w-4">{idx + 1}</div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform"
                  style={{ backgroundColor: team.color, boxShadow: `0 8px 16px ${team.color}44` }}
                >
                  {team.initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-2">
                    {team.name}
                    {team.id === currentUserId && (
                      <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase tracking-tighter">
                        Me
                      </span>
                    )}
                    {team.id === currentUserId && showCooldown && (
                      <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter">
                        Cooldown
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="font-black text-xl text-slate-800 tracking-tight">
                  {team.totalPoints.toFixed(1)}
                </div>
                {idx === 0 && (
                  <span className="text-[9px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span> Leader
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity / Feed */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Feed</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {recentPicks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
              No activity yet. The draft is waiting.
            </div>
          ) : (
            recentPicks.map((pick, idx) => {
              const isMe = pick.user_id === currentUserId;
              const date = new Date(pick.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div
                  key={pick.id}
                  className="p-4 text-sm flex items-start gap-4 hover:bg-slate-50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-600 leading-snug">
                      <span className="font-black text-slate-900">
                        {isMe ? 'You' : 'A rival'}
                      </span>
                      <span className="mx-1">picked up</span>
                      <span className="font-black text-purple-600">{pick.show_name}</span>
                    </p>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{date}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;