import React, { useState, useMemo, useEffect } from 'react';
import { Show } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Search, Trophy, Tv, Loader2 } from 'lucide-react';
import * as api from '../services/api';

interface LeaderboardProps {
  onBack: () => void;
}

type SortField = 'cumulativeRating' | 'title' | 'network' | 'imdbRating';

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
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
                premiereDate: item.release_date || item.premiere_date || 'TBD',
                description: '',
                projectedRating: 0,
                cumulativeRating: item.cumulative_viewership || item.total_viewers || 0,
                lastPoints: 0, // View might not have this, default to 0
                status: 'available',
                posterUrl: item.poster_url,
                imdbRating: item.imdb_rating
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

      // Handle potentially undefined values (like imdbRating)
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparisons
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [shows, sortField, sortDirection, searchTerm, categoryFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="w-4 h-4 inline-block opacity-0 group-hover:opacity-30 ml-1">↕</span>;
    return sortDirection === 'asc' 
      ? <TrendingUp className="w-4 h-4 inline-block ml-1 text-purple-600" /> 
      : <TrendingDown className="w-4 h-4 inline-block ml-1 text-purple-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
             <Trophy className="w-8 h-8 text-amber-500" /> Global Leaderboard
          </h1>
          <p className="text-slate-500 font-medium">Tracking total viewership across all networks & platforms.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
            <input 
                type="text" 
                placeholder="Search shows or networks..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button 
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                All
            </button>
            <button 
                onClick={() => setCategoryFilter('cable')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${categoryFilter === 'cable' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Broadcast
            </button>
            <button 
                onClick={() => setCategoryFilter('streaming')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${categoryFilter === 'streaming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Streaming
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-600" />
              <p className="text-sm font-medium">Loading rankings...</p>
           </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 w-16 text-center">#</th>
                        <th className="px-6 py-4 cursor-pointer hover:text-purple-600 group" onClick={() => handleSort('title')}>
                            Show <SortIcon field="title" />
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:text-purple-600 group" onClick={() => handleSort('network')}>
                            Network <SortIcon field="network" />
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:text-purple-600 group text-right" onClick={() => handleSort('imdbRating')}>
                            Rating <SortIcon field="imdbRating" />
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:text-purple-600 group text-right" onClick={() => handleSort('cumulativeRating')}>
                           Total Viewers <SortIcon field="cumulativeRating" />
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredAndSortedShows.map((show, index) => (
                        <tr key={show.id} className="hover:bg-purple-50/30 transition-colors group">
                            <td className="px-6 py-4 text-center font-bold text-slate-400">
                                {index + 1}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {show.posterUrl ? (
                                        <img src={show.posterUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm bg-slate-200" />
                                    ) : (
                                        <div className="w-10 h-14 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                            <Tv className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{show.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${show.category === 'streaming' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {show.category === 'streaming' ? 'Stream' : 'Cable'}
                                            </span>
                                            {show.premiereDate && show.premiereDate !== 'TBD' && (
                                                <span className="text-xs text-slate-400">{show.premiereDate}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded text-sm">
                                    {show.network}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {show.imdbRating ? (
                                    <span className="font-bold text-yellow-600 flex items-center justify-end gap-1">
                                        ★ {show.imdbRating}
                                    </span>
                                ) : (
                                    <span className="text-slate-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="font-mono font-bold text-lg text-slate-800">
                                    {show.cumulativeRating.toLocaleString()}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredAndSortedShows.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                No shows found matching your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;