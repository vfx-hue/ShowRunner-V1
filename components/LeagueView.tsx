import React, { useMemo, useState } from 'react';
import { Team, Show, STANDARD_NETWORK_MULTIPLIER } from '../types';
import { ArrowLeft, Users, RefreshCw, UserPlus, Info, UserMinus, Settings } from 'lucide-react';
import LeagueSettingsModal from './LeagueSettingsModal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

/* ---------------------------------------------
   DATE NORMALIZER (SUPABASE & SHORT FORMAT SAFE)
--------------------------------------------- */
const normalizeDate = (raw: string): number | null => {
  if (!raw) return null;
  // If it's a full ISO string (contains 'T' or looks like YYYY-MM-DD)
  if (raw.includes('-') || raw.includes('T')) {
    const ts = Date.parse(raw);
    return isNaN(ts) ? null : ts;
  }
  // If it's MM/DD format
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const [, month, day] = match;
    const year = 2026;
    return Date.UTC(year, Number(month) - 1, Number(day));
  }
  return null;
};

interface LeagueViewProps {
  teams: Team[];
  onBack: () => void;
  onUpdateRatings: () => void;
  loading: boolean;
  onWaiverWire: () => void;
  leagueName: string;
  onShowClick: (show: Show) => void;
  currentUserId: string;
  leagueManagerId: string;
  onRemoveMember: (userId: string) => void;
  onDropShow?: (showId: string) => void;
  isDraftOver?: boolean;
  showCooldown?: boolean;
}

const LeagueView: React.FC<LeagueViewProps> = ({
  teams,
  onBack,
  onUpdateRatings,
  loading,
  onWaiverWire,
  leagueName,
  onShowClick,
  currentUserId,
  leagueManagerId,
  onRemoveMember,
  onDropShow,
  isDraftOver = false,
  showCooldown = false,
}) => {
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  /* ---------------------------------------------
     STABLE & OPTIMIZED TIME-SERIES CHART DATA
  --------------------------------------------- */
  const { chartData, teamLines } = useMemo(() => {
    // 1. Collect all unique dates across all teams and shows
    const dateMap = new Map<number, { [teamId: string]: number }>();
    const allDates = new Set<number>();

    teams.forEach(team => {
      team.roster.forEach(show => {
        show.viewershipHistory?.forEach(entry => {
          const ts = normalizeDate(entry.rating_date);
          if (ts) {
            allDates.add(ts);
          }
        });
      });
    });

    const sortedDates = Array.from(allDates).sort((a, b) => a - b);

    // 2. Pre-calculate viewport-friendly labels and data points
    // We want to calculate the cumulative total for each team at each specific date
    const points = sortedDates.map(ts => {
      const point: any = {
        timestamp: ts,
        formattedDate: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      teams.forEach(team => {
        let cumulativeForTeamAtTs = 0;
        team.roster.forEach(show => {
          show.viewershipHistory?.forEach(entry => {
            const entryTs = normalizeDate(entry.rating_date);
            if (entryTs && entryTs <= ts) {
              const multiplier = show.category === 'streaming' ? 1 : STANDARD_NETWORK_MULTIPLIER;
              cumulativeForTeamAtTs += (entry.viewers || 0) * multiplier;
            }
          });
        });
        point[team.id] = cumulativeForTeamAtTs;
      });

      return point;
    });

    // 3. Sampling for performance if too many points
    let finalPoints = points;
    if (points.length > 20) {
      const step = Math.ceil(points.length / 15);
      finalPoints = points.filter((_, i) => i % step === 0 || i === points.length - 1);
    }

    return {
      chartData: finalPoints,
      teamLines: teams.map(t => ({ id: t.id, name: t.name, color: t.color }))
    };
  }, [teams]);

  // Custom Tick for Y-Axis
  const formatYAxis = (val: any): string => {
    if (typeof val !== 'number') return String(val);
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return String(val);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-24 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{leagueName}</h1>
              <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Live</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {teams.length} Managers</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1.5"> 2026 Season</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2.5 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:text-purple-700 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md"
          >
            <Settings className="w-4 h-4" />
            League Settings
          </button>
          <button
            onClick={onWaiverWire}
            className="flex items-center gap-2.5 bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:text-purple-700 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            {isDraftOver ? 'Waiver Wire' : 'Enter Draft Room'}
          </button>
          <button
            onClick={onUpdateRatings}
            disabled={loading}
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-slate-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Sync Data'}
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-8">
        {/* CHART SECTION (Premium Area Chart) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Viewership Momentum</h2>
                <p className="text-slate-500 text-sm font-medium">Cumulative total views across all shows in roster</p>
              </div>
              <div className="flex flex-wrap gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                {teamLines.map(t => (
                  <button
                    key={t.id}
                    onMouseEnter={() => setHoveredTeamId(t.id)}
                    onMouseLeave={() => setHoveredTeamId(null)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${hoveredTeamId === t.id ? 'bg-white shadow-sm scale-105' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}44` }}></span>
                    <span className="text-xs font-bold text-slate-700">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      {teamLines.map(t => (
                        <linearGradient key={`grad-${t.id}`} id={`color-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={t.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={15}
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 min-w-[200px]">
                              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 border-b border-slate-100 pb-2">
                                {new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                              <div className="space-y-2.5">
                                {([...payload] as any[]).sort((a, b) => (b.value as number) - (a.value as number)).map((entry: any) => (
                                  <div key={entry.dataKey} className={`flex items-center justify-between gap-4 ${hoveredTeamId && entry.dataKey !== hoveredTeamId ? 'opacity-40' : ''}`}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                      <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 font-mono">
                                      {(entry.value as number).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {teamLines.map((t) => (
                      <Area
                        key={t.id}
                        type="monotone"
                        dataKey={t.id}
                        stroke={t.color}
                        strokeWidth={hoveredTeamId === t.id ? 4 : 3}
                        fillOpacity={1}
                        fill={`url(#color-${t.id})`}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: t.color }}
                        name={t.name}
                        connectNulls={true}
                        strokeOpacity={hoveredTeamId && hoveredTeamId !== t.id ? 0.2 : 1}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[2rem] border-4 border-dashed border-slate-100">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Season Data</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Ratings start appearing after the first week</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TEAM ROSTERS GRID */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">League Rosters</h2>
              <p className="text-sm text-slate-500 font-medium">Click a show to view full performance details</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Info className="w-3.5 h-3.5" />
              TOP 4 TEAMS
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                onMouseEnter={() => setHoveredTeamId(team.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
                className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col ${hoveredTeamId === team.id ? 'shadow-2xl shadow-slate-200 -translate-y-1 border-purple-100' : 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'}`}
              >
                {/* Team Header */}
                <div className="px-6 py-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-br from-white to-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg transition-transform"
                      style={{ backgroundColor: team.color, boxShadow: `0 8px 16px -4px ${team.color}66` }}
                    >
                      {team.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-lg font-black text-slate-900">{team.name}</h3>
                        {team.id === currentUserId && (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            YOU
                          </div>
                        )}
                        {showCooldown && team.id === currentUserId && (
                          <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold text-orange-500 uppercase tracking-wider border border-orange-100">
                            Cooldown Active
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900 font-mono tracking-wider">
                        {team.totalPoints.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Views</div>
                    </div>
                    {currentUserId === leagueManagerId && team.id !== currentUserId && !isDraftOver && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to remove ${team.name}? This will delete all their picks.`)) {
                            onRemoveMember(team.id);
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove Member"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Roster Table */}
                <div className="flex-1">
                  <table className="w-full text-sm text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-3 font-black text-[11px] text-slate-500 uppercase tracking-widest border-b border-slate-100">Show</th>
                        <th className="px-6 py-3 font-black text-[11px] text-slate-500 uppercase tracking-widest text-right border-b border-slate-100">Weekly</th>
                        <th className="px-6 py-3 font-black text-[11px] text-slate-500 uppercase tracking-widest text-right border-b border-slate-100">Total</th>
                        <th className="px-6 py-3 font-black text-[11px] text-slate-500 uppercase tracking-widest text-right border-b border-slate-100">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {team.roster.map((show) => (
                        <tr
                          key={show.id}
                          onClick={() => onShowClick(show)}
                          className="group/row hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-5">
                            <div className="font-black text-slate-800 group-hover/row:text-purple-700 transition-colors truncate max-w-[160px] text-base mb-0.5">{show.title}</div>
                            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                              <span className={`w-2 h-2 rounded-full ${show.category === 'streaming' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                              {show.network}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {show.lastPoints > 0 ? (
                              <div className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 bg-emerald-100/50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                +{show.lastPoints.toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-mono font-semibold text-[15px] text-slate-900 group-hover/row:text-purple-900 transition-transform tracking-wider">
                              {show.cumulativeRating ? show.cumulativeRating.toLocaleString() : '0'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {team.id === currentUserId && onDropShow && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to drop ${show.title}?`)) {
                                    onDropShow(show.id);
                                  }
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Drop Show"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty Slots */}
                {team.roster.length < 6 && (
                  <div className="p-4 bg-slate-50/30 border-t border-slate-50">
                    <div className="flex gap-2">
                      {Array.from({ length: 6 - team.roster.length }).map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-200 w-0 group-hover:w-full transition-all duration-1000" style={{ transitionDelay: `${i * 100}ms` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {showSettings && (
        <LeagueSettingsModal
          league={{
            id: localStorage.getItem('active_league_id') || '',
            name: leagueName,
            created_by: leagueManagerId
          } as any}
          currentUserId={currentUserId}
          onClose={() => setShowSettings(false)}
          onRefresh={onUpdateRatings}
          isDraftOver={isDraftOver}
        />
      )}
    </div>
  );
};

export default LeagueView;