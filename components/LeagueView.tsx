import React, { useMemo, useState } from 'react';
import { Team, Show, STANDARD_NETWORK_MULTIPLIER } from '../types';
import { ArrowLeft, Users, RefreshCw, UserPlus, Info, UserMinus, Settings, Clock, Tv, PlayCircle, Smartphone, Flame, Calendar, ChevronDown, Trophy } from 'lucide-react';
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
  cooldownExpiresAt?: number | null;
  periods: any[];
  selectedPeriodId: string | null;
  onPeriodChange: (periodId: string) => void;
  careerStats?: Record<string, { total_points: number, avg_finish: number }>;
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
  cooldownExpiresAt = null,
  periods,
  selectedPeriodId,
  onPeriodChange,
  careerStats = {},
}) => {
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  // Cooldown Timer Logic
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
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

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

    let sortedDates = Array.from(allDates).sort((a, b) => a - b);

    const draftTimeTs = periods.find(p => p.id === selectedPeriodId)?.draft_start_time
      ? new Date(periods.find(p => p.id === selectedPeriodId).draft_start_time).getTime()
      : null;

    // Filter by draft time - chart should only show growth after the draft
    if (draftTimeTs) {
      sortedDates = sortedDates.filter(ts => ts > draftTimeTs);

      // Add draft day as a starting point if we have data after or if we want an empty baseline
      if (sortedDates.length >= 0) {
        sortedDates = [draftTimeTs, ...sortedDates];
      }
    }

    // Filter by time range
    if (timeRange !== 'all' && sortedDates.length > 0) {
      const now = Date.now();
      const days = timeRange === '7d' ? 7 : 30;
      const cutoff = now - (days * 24 * 60 * 60 * 1000);

      const filtered = sortedDates.filter(ts => ts >= cutoff);

      // If filtering by current time yields no data (old data), anchor to latest data point instead
      if (filtered.length === 0) {
        const latest = Math.max(...sortedDates);
        const anchorCutoff = latest - (days * 24 * 60 * 60 * 1000);
        sortedDates = sortedDates.filter(ts => ts >= anchorCutoff);
      } else {
        sortedDates = filtered;
      }
    }


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
  }, [teams, timeRange, periods, selectedPeriodId]);

  // Custom Tick for Y-Axis
  const formatYAxis = (val: any): string => {
    if (typeof val !== 'number') return String(val);
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return String(val);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-24 animate-fade-in-up">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 text-slate-400 hover:text-purple-600 transition-all shadow-sm active:scale-95"
            title="Return to Network"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{leagueName}</h1>
              {(() => {
                const p = periods.find(p => p.id === selectedPeriodId);
                if (p?.status === 'active') return <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider text-center">Live</div>;

                // Finalization Window Logic (7 days)
                if (p?.status === 'finished') {
                  // Month end + 7 days
                  const [year, month] = p.month_year.split('-').map(Number);
                  const periodEndDate = new Date(year, month, 0); // Last day of month
                  const finalizationDate = new Date(periodEndDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                  const isFinalized = Date.now() > finalizationDate.getTime();

                  return (
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider text-center ${isFinalized ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {isFinalized ? 'Finalized' : 'Pending Finalization'}
                    </div>
                  );
                }

                return <div className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-wider text-center">Snapshot</div>;
              })()}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-300" /> {teams.length} Managers</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="flex items-center gap-1.5 italic"> 2026 Season</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="relative group">
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="appearance-none bg-white border-2 border-slate-100 text-slate-700 hover:border-purple-200 hover:text-purple-700 pl-11 pr-10 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer outline-none"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.month_year} {p.status === 'active' ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-purple-500 transition-colors" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-purple-500 transition-colors" />
          </div>

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
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['7d', '30d', 'all'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {range === 'all' ? 'Season' : range}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  {teamLines.map(t => (
                    <button
                      key={t.id}
                      onMouseEnter={() => setHoveredTeamId(t.id)}
                      onMouseLeave={() => setHoveredTeamId(null)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${hoveredTeamId === t.id ? 'bg-white shadow-sm scale-110' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}44` }}></span>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{t.name}</span>
                    </button>
                  ))}
                </div>
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
              <button
                onClick={onBack}
                className="mb-8 flex items-center text-[10px] font-black text-slate-400 hover:text-purple-600 transition-all uppercase tracking-[0.2em]"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                Return to Network
              </button>
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
                className={`premium-card overflow-hidden flex flex-col ${hoveredTeamId === team.id ? 'shadow-2xl shadow-slate-200 -translate-y-1 ring-2 ring-purple-100/50' : ''}`}
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
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{team.name}</h3>
                        {team.id === currentUserId && (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            YOU
                          </div>
                        )}
                        {timeLeft && team.id === currentUserId && (
                          <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold text-orange-500 uppercase tracking-wider border border-orange-100">
                            <Clock className="w-3 h-3" />
                            {timeLeft}
                          </div>
                        )}
                      </div>
                      {careerStats[team.id] && (
                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100/50">
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500/60" /> {Math.floor(careerStats[team.id].total_points).toLocaleString()}</span>
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                          <span>Avg Rank: #{careerStats[team.id].avg_finish.toFixed(1)}</span>
                        </div>
                      )}
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
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-50">Show</th>
                        <th className="px-4 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest text-right border-b border-slate-50">Matchup</th>
                        <th className="px-4 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest text-right border-b border-slate-50">Lifetime</th>
                        <th className="px-4 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest text-right border-b border-slate-50">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {team.roster.map((show) => (
                        <tr
                          key={show.id}
                          onClick={() => onShowClick(show)}
                          className="group/row hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-4">
                            <div className="text-[12px] font-mono font-bold text-slate-700 group-hover/row:text-purple-700 transition-colors truncate max-w-[100px] mb-0.5">{show.title}</div>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                              {show.category === 'streaming' ? (
                                <Smartphone className="w-3 h-3 text-purple-500" />
                              ) : (
                                <Tv className="w-3 h-3 text-blue-500" />
                              )}
                              {show.network}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {show.lastPoints > 0 ? (
                              <div className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 bg-emerald-100/50 px-2.5 py-1.5 rounded-xl border border-emerald-200 relative">
                                +{show.lastPoints.toLocaleString()}
                                {loading && (
                                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-emerald-500 font-black animate-float-up pointer-events-none">
                                    +{show.lastPoints.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(() => {
                              const history = show.viewershipHistory || [];
                              const latest = history[history.length - 1];
                              const previous = history[history.length - 2];
                              const isHeating = previous && latest && latest.viewers > previous.viewers;

                              return (
                                <div className="font-mono font-bold text-[14px] text-slate-300 opacity-40 group-hover/row:opacity-100 transition-all tracking-wider flex items-center justify-end gap-2">
                                  {isHeating && (
                                    <div className="group/heat relative">
                                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-lg text-[9px] font-black border border-amber-100 animate-pulse tracking-widest">
                                        <Flame className="w-3 h-3 fill-amber-500" />
                                        HEAT
                                      </div>
                                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 text-white text-[10px] font-bold p-2.5 rounded-xl opacity-0 group-hover/heat:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-slate-800 leading-relaxed tracking-normal text-left">
                                        <div className="text-amber-400 mb-1 flex items-center gap-1"><Flame className="w-3 h-3" /> SCORING BOOST</div>
                                        This show has positive momentum! Viewership is multiplied by <span className="text-white font-mono">(1 + Growth%)</span> this week.
                                      </div>
                                    </div>
                                  )}
                                  {show.cumulativeRating ? show.cumulativeRating.toLocaleString() : '0'}
                                </div>
                              );
                            })()}
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