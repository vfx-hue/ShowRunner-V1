import React from 'react';
import { Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StandingsProps {
  teams: Team[];
  hideChart?: boolean;
  compact?: boolean;
}

const Standings: React.FC<StandingsProps> = ({ teams, hideChart = false, compact = false }) => {
  // Sort teams by points descending
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-8">
      {/* Chart Section */}
      {!hideChart && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">League Standings</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedTeams} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                  width={120}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    color: '#1e293b',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(val: number) => [val.toLocaleString(), 'Points']}
                />
                <Bar dataKey="totalPoints" radius={[0, 6, 6, 0]} barSize={32}>
                  {sortedTeams.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rosters Grid */}
      <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-100" style={{ borderTop: `4px solid ${team.color}` }}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg truncate">{team.name}</h3>
                <span className="text-2xl font-bold text-slate-900">
                  {team.totalPoints.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-semibold">{team.owner}</p>
            </div>
            
            {/* Removed max-h and overflow-y-auto to prevent internal scrolling */}
            <div className="flex-1 p-3 space-y-2 bg-gray-50/50">
              {team.roster.length === 0 ? (
                <div className="h-20 flex items-center justify-center text-slate-400 text-sm italic">
                  Empty Roster
                </div>
              ) : (
                team.roster.map((show) => (
                  <div key={show.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group hover:border-purple-200 transition-colors">
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{show.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{show.network}</p>
                    </div>
                    <div className="flex flex-col items-end pl-2">
                       <span className="text-sm font-bold text-slate-700">{show.cumulativeRating.toLocaleString()}</span>
                       {show.lastPoints > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+{show.lastPoints.toLocaleString()}</span>
                       )}
                    </div>
                  </div>
                ))
              )}
              {/* Draft slots placeholders */}
              {Array.from({ length: Math.max(0, 6 - team.roster.length) }).map((_, i) => (
                <div key={i} className="border border-dashed border-gray-300 rounded-lg p-3 h-12 flex items-center justify-center bg-gray-50">
                   <span className="text-xs text-gray-400 font-medium">Open Slot</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Standings;