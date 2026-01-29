import React, { useMemo } from 'react';
import { Show } from '../types';
import { X, Star, Calendar, Tv, TrendingUp, Award, Info, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ShowDetailsModalProps {
  show: Show;
  onClose: () => void;
  onDraft?: (show: Show) => void;
  isDraftable: boolean;
  isMyTurn?: boolean;
  currentDrafterName?: string;
}

const ShowDetailsModal: React.FC<ShowDetailsModalProps> = ({
  show,
  onClose,
  onDraft,
  isDraftable,
  isMyTurn = false,
  currentDrafterName
}) => {

  // Helper to determine label for date
  const displayDate = show.nextEpisodeDate || 'TBD';
  const isDate = !isNaN(Date.parse(displayDate)) && !displayDate.toLowerCase().includes('aired');

  // Prepare Chart Data (Last 5 entries)
  const chartData = useMemo(() => {
    if (!show.viewershipHistory || show.viewershipHistory.length === 0) return [];

    // Take the last 5 entries
    const recent = show.viewershipHistory.slice(-5);

    return recent.map(entry => ({
      date: new Date(entry.rating_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      viewers: entry.viewers
    }));
  }, [show.viewershipHistory]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster Side */}
        <div className="w-full md:w-2/5 h-64 md:h-auto bg-slate-100 relative shrink-0">
          {show.posterUrl && show.posterUrl.startsWith('http') ? (
            <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
              <Tv className="w-16 h-16" />
            </div>
          )}
          <div className="absolute top-0 left-0 bg-gradient-to-b from-black/60 to-transparent w-full h-20 md:hidden"></div>

          {/* Mobile Overlay Text */}
          <div className="absolute bottom-4 left-4 md:hidden">
            <h2 className="text-2xl font-black text-white drop-shadow-md">{show.title}</h2>
          </div>
        </div>

        {/* Content Side */}
        <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${show.category === 'streaming' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                {show.category}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {show.network}
              </span>
            </div>

            <h2 className="hidden md:block text-3xl font-black text-slate-900 leading-tight mb-2">{show.title}</h2>

            <div className="flex items-center gap-4 text-sm mt-2 md:mt-0">
              {show.imdbRating && (
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {show.imdbRating}/10
                </div>
              )}
              {displayDate && displayDate !== 'TBD' && (
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  {isDate ? <Calendar className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  {isDate ? 'Next Ep: ' : 'Status: '} {displayDate}
                </div>
              )}
              {show.hype !== undefined && (
                <div className="flex items-center gap-1 text-purple-600 font-bold ml-auto">
                  <TrendingUp className="w-4 h-4" /> Hype: {show.hype}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs font-bold uppercase">
                <TrendingUp className="w-3 h-3" /> Total Viewers
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-900">
                {(show.cumulativeRating / 1000000).toFixed(2)}M
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs font-bold uppercase">
                <Award className="w-3 h-3" /> Latest Points
              </div>
              <div className="text-xl md:text-2xl font-black text-emerald-600">
                +{show.lastPoints.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          {chartData.length > 1 && (
            <div className="mb-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Viewership Velocity (Last 5 Updates)
              </h3>
              <div className="h-36 w-full origin-bottom animate-slide-up">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white px-3 py-2 rounded-xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                              <p className="text-[10px] font-black text-slate-900">
                                {payload[0].value?.toLocaleString()} <span className="text-slate-400">VIEWS</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="viewers"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorViewers)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-auto">
            {isDraftable && onDraft ? (
              isMyTurn ? (
                <button
                  onClick={() => { onDraft(show); onClose(); }}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Draft {show.title}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" /> Waiting for {currentDrafterName}
                </button>
              )
            ) : (
              <div className="text-center p-3 bg-gray-50 rounded-lg text-slate-500 font-medium text-sm">
                {show.status === 'drafted' ? `Drafted by ${show.draftedBy}` : 'Currently View Only'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetailsModal;