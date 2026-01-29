import React from 'react';
import { Settings, Activity } from 'lucide-react';
import { Team } from '../types';

interface DashboardProps {
  teams: Team[];
  onSelectLeague: () => void;
  recentPicks: any[];
  currentUserId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ teams, onSelectLeague, recentPicks, currentUserId }) => {
  // Sort teams by points
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-6 animate-fade-in px-4">
      <h2 className="text-4xl font-extrabold text-slate-900 text-center mb-8 tracking-tight">Dashboard</h2>

      {/* League List Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onSelectLeague}
          >
            <h3 className="text-lg font-bold text-slate-900">The League 2026 (2026)</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedTeams.map((team, idx) => (
            <div
              key={team.id}
              onClick={onSelectLeague}
              className="flex items-center justify-between p-4 hover:bg-purple-50/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white`}
                  style={{ backgroundColor: team.color }}
                >
                  {team.initials}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {team.name}
                  </div>
                  {/* Removed team.owner display */}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className={`font-bold text-lg font-mono text-slate-700`}>
                  {team.totalPoints.toFixed(1)}
                </div>
                {idx === 0 && (
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Leader
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
          <button
            onClick={onSelectLeague}
            className="text-xs font-bold text-slate-500 hover:text-purple-600 uppercase tracking-wide transition-colors"
          >
            View Full Standings
          </button>
        </div>
      </div>

      {/* Recent Activity / Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {recentPicks.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm italic">
              No activity yet. Start drafting!
            </div>
          ) : (
            recentPicks.map((pick) => {
              const isMe = pick.user_id === currentUserId;
              const date = new Date(pick.created_at).toLocaleDateString();
              return (
                <div key={pick.id} className="p-3 text-sm flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-purple-400 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">
                      {isMe ? 'You' : 'A player'}
                    </span>
                    <span className="text-slate-600"> drafted </span>
                    <span className="font-medium text-purple-700">{pick.show_name}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{date}</div>
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