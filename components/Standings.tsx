import React from 'react';
import { Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame } from 'lucide-react';

interface StandingsProps {
  teams: Team[];
  hideChart?: boolean;
  compact?: boolean;
}

const Standings: React.FC<StandingsProps> = ({ teams, hideChart = false, compact = false }) => {
  // Sort teams by points descending
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Chart Section */}
      {!hideChart && (
        <div className="premium-card p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[10px] uppercase font-black text-purple-500 tracking-[0.2em] mb-1">Performance</p>
              <h2 className="text-2xl font-black text-slate-900">League Standings</h2>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedTeams} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 800, fontFamily: 'Outfit' }}
                  width={140}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(226, 232, 240, 0.5)',
                    color: '#0f172a',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                />
                <Bar dataKey="totalPoints" radius={[0, 12, 12, 0]} barSize={36}>
                  {sortedTeams.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rosters Grid */}
      <div className={`grid gap-8 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4'}`}>
        {teams.map((team) => (
          <div key={team.id} className="premium-card overflow-hidden flex flex-col group">
            <div className="p-6 border-b border-slate-50 relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="font-black text-slate-900 text-lg truncate mb-1">{team.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{team.roster.length} Active Shows</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">
                    {team.totalPoints.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Points</span>
                </div>
              </div>
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-20"
                style={{ backgroundColor: team.color }}
              ></div>
            </div>

            <div className="p-4 space-y-3 bg-slate-50/30 flex-1">
              {team.roster.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                  Roster Empty
                </div>
              ) : (
                team.roster.map((show) => (
                  <div key={show.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group/item hover:border-purple-200 transition-all duration-300 hover:shadow-md">
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-black text-slate-800 truncate group-hover/item:text-purple-700 transition-colors">{show.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{show.network}</p>
                    </div>
                    <div className="flex flex-col items-end pl-2">
                      <span className="text-sm font-black text-slate-700">{show.cumulativeRating.toLocaleString()}</span>
                      {show.lastPoints > 0 && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5">
                          <Flame className="w-2 h-2" /> {show.lastPoints.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              {/* Draft slots placeholders */}
              {Array.from({ length: Math.max(0, 6 - team.roster.length) }).map((_, i) => (
                <div key={i} className="border-2 border-dashed border-slate-200 rounded-2xl p-4 h-16 flex items-center justify-center bg-slate-50/50 opacity-60">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Available Slot</span>
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