import React, { useState, useEffect } from 'react';
import { Show } from '../types';
import { fetchUpcomingShows } from '../services/geminiService';
import { addShow } from '../services/api';
import { Plus, Check, Search, Tv, Calendar, Info, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AdminShowDiscoveryProps {
    onBack: () => void;
    existingShows: Show[];
    onShowAdded: () => void;
}

const AdminShowDiscovery: React.FC<AdminShowDiscoveryProps> = ({ onBack, existingShows, onShowAdded }) => {
    const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'cable' | 'streaming'>('all');

    useEffect(() => {
        const loadUpcoming = async () => {
            setLoading(true);
            try {
                const data = await fetchUpcomingShows();
                setUpcomingShows(data);
            } catch (error) {
                console.error("Failed to fetch upcoming shows", error);
            } finally {
                setLoading(false);
            }
        };
        loadUpcoming();
    }, []);

    const handleAddShow = async (show: Show) => {
        setAddingId(show.id);
        try {
            await addShow(show);
            onShowAdded();
            // Optionally remove from upcoming or mark as added locally
        } catch (error) {
            console.error("Error adding show", error);
            alert("Failed to add show. It might already exist.");
        } finally {
            setAddingId(null);
        }
    };

    const isAlreadyInDatabase = (title: string) => {
        return existingShows.some(s => s.title.toLowerCase() === title.toLowerCase());
    };

    const filteredUpcoming = upcomingShows.filter(show => {
        const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            show.network.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || show.category === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-6xl mx-auto mt-8 px-4 pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Show Discovery</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Identify and add future blockbusters to the draft pool</p>
                </div>

                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search upcoming titles, networks..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {(['all', 'cable', 'streaming'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-500" />
                    <p className="font-bold text-lg">Scanning the horizon for new hits...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUpcoming.map((show) => {
                        const added = isAlreadyInDatabase(show.title);
                        return (
                            <div
                                key={show.id}
                                className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-300 flex flex-col overflow-hidden ${added ? 'border-slate-100 opacity-80' : 'border-white hover:border-purple-200 shadow-xl shadow-slate-200/50 -translate-y-1'}`}
                            >
                                {/* Visual Header */}
                                <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                        <Tv className="w-24 h-24 absolute -right-4 -bottom-4 text-white rotate-12" />
                                    </div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                        <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${show.category === 'streaming' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                            {show.category}
                                        </span>
                                        <h3 className="text-white font-black text-xl truncate">{show.title}</h3>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="p-2 bg-slate-50 rounded-lg"><Tv className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</p>
                                                <p className="font-bold text-sm">{show.network}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="p-2 bg-slate-50 rounded-lg"><Calendar className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premiere</p>
                                                <p className="font-bold text-sm text-purple-600">{show.premiereDate}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                                        {show.description}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buzz Score</span>
                                            <span className="text-lg font-black text-slate-900">{show.projectedRating}</span>
                                        </div>

                                        {added ? (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm">
                                                <Check className="w-4 h-4" />
                                                In Pool
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddShow(show)}
                                                disabled={addingId === show.id}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 group-hover:scale-105"
                                            >
                                                {addingId === show.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Plus className="w-4 h-4" />
                                                )}
                                                Add to Draft
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Card */}
            <div className="mt-12 bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                    <Info className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-indigo-900 font-black text-lg mb-1">Discovering New Talent</h4>
                    <p className="text-indigo-700 font-medium leading-relaxed">
                        Shows added here will become immediately available for all leagues to draft.
                        This tool uses AI to scan for upcoming premieres across major networks and streaming platforms.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminShowDiscovery;
