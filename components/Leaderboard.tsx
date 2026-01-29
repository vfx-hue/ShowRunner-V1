import React, { useState, useMemo, useEffect } from 'react';
import { Show } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Search, Trophy, Tv, Loader2, Star, Rocket, Info, Calendar } from 'lucide-react';
import * as api from '../services/api';

interface LeaderboardProps {
  onBack: () => void;
  onShowClick: (show: Show) => void;
}

type SortField = 'cumulativeRating' | 'network' | 'imdbRating' | 'hype';

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, onShowClick }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortField, setSortField] = useState<SortField>('cumulativeRating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cable' | 'streaming'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getGlobalShowRankings();
        // Map database view to Show interface
        const mappedShows: Show[] = data.map((item: any) => {
          // Determine category if not present
          let cat: 'cable' | 'streaming' = 'cable';
          if (item.category) {
            cat = item.category === 'streaming' ? 'streaming' : 'cable';
          } else if (item.type) {
            cat = item.type.toLowerCase() === 'streaming' ? 'streaming' : 'cable';
          } else {
            const streamingNetworks = ['Netflix', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+', 'Peacock', 'Max'];
            cat = streamingNetworks.includes(item.network) ? 'streaming' : 'cable';
          }

          return {
            id: item.show_id || item.id,
            title: item.show_name || item.title,
            network: item.network || 'N/A',
            category: cat,
            nextEpisodeDate: item["Next Episode Date"] || item.release_date || item.premiere_date || 'TBD',
            description: '',
            projectedRating: 0,
            cumulativeRating: item.cumulative_viewership || item.total_viewers || 0,
            lastPoints: 0, // View might not have this, default to 0
            status: 'available',
            posterUrl: item.poster_url,
            imdbRating: item.imdb_rating,
            hype: item.hype || 0
          };
        });
        setShows(mappedShows);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedShows = useMemo(() => {
    let result = [...shows];

    // Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(term) ||
        s.network.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle potentially undefined values
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Handle number comparisons
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      if (aNum < bNum) return sortDirection === 'asc' ? -1 : 1;
      if (aNum > bNum) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [shows, sortField, sortDirection, searchTerm, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Star className="w-10 h-10 text-purple-600 drop-shadow-sm" /> Global Rankings
            </h1>
          </div>
        </div>

        {/* Sort Controls (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { label: 'Views', field: 'cumulativeRating' as const },
            { label: 'Hype', field: 'hype' as const },
            { label: 'Stars', field: 'imdbRating' as const }
          ].map((option) => (
            <button
              key={option.field}
              onClick={() => handleSort(option.field)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sortField === option.field ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search shows or networks..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setCategoryFilter('cable')}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === 'cable' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cable
          </button>
          <button
            onClick={() => setCategoryFilter('streaming')}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === 'streaming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Streaming
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-600" />
          <p className="text-lg font-bold">Synchronizing data streams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredAndSortedShows.map((show, index) => {
            const rank = index + 1;
            return (
              <div
                key={show.id}
                onClick={() => onShowClick(show)}
                className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-purple-200 transition-all duration-500 cursor-pointer flex flex-col animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Poster Image Area */}
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  {show.posterUrl && show.posterUrl.startsWith('http') ? (
                    <img
                      src={show.posterUrl}
                      alt={show.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300">
                      <Tv className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{show.title}</span>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>

                  {/* Rank Badge */}
                  <div className={`absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-lg backdrop-blur-md ${rank === 1 ? 'bg-amber-500 text-white' :
                    rank === 2 ? 'bg-slate-300 text-slate-900' :
                      rank === 3 ? 'bg-orange-500 text-white' :
                        'bg-black/50 text-white'
                    }`}>
                    {rank}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/20">
                    <span className={`w-1.5 h-1.5 rounded-full ${show.category === 'streaming' ? 'bg-indigo-400' : 'bg-orange-400'}`}></span>
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">{show.category === 'streaming' ? 'Stream' : 'Cable'}</span>
                  </div>

                  {/* Rating / Hype */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div className="flex flex-col">
                      <h3 className="text-white font-black text-sm leading-tight drop-shadow-lg line-clamp-1">{show.title}</h3>
                      <p className="text-white/70 text-[10px] font-bold">{show.network}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Stats Area */}
                <div className="p-4 bg-white flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Views</span>
                      <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">
                        {show.cumulativeRating >= 1000000
                          ? `${(show.cumulativeRating / 1000000).toFixed(1)}M`
                          : show.cumulativeRating.toLocaleString()}
                      </span>
                    </div>
                    {show.imdbRating && (
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-yellow-100">
                        <Star className="w-2.5 h-2.5 fill-current" /> {show.imdbRating}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-black text-purple-600 uppercase">
                      <Rocket className="w-3 h-3" /> {show.hype} Hype
                    </div>
                    {show.nextEpisodeDate && show.nextEpisodeDate !== 'TBD' && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                        <Calendar className="w-2.5 h-2.5" /> {show.nextEpisodeDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAndSortedShows.length === 0 && !loading && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-100">
              <Search className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-xl font-bold">No hits found here.</p>
              <p className="text-sm font-medium mt-2">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;