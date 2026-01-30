import React, { useState, useEffect } from 'react';
import { Trophy, Users, ArrowLeft, Loader2, Star, TrendingUp } from 'lucide-react';
import * as api from '../services/api';

interface GlobalTeamLeaderboardProps {
    onBack: () => void;
}

const GlobalTeamLeaderboard: React.FC<GlobalTeamLeaderboardProps> = ({ onBack }) => {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.getGlobalTeamRankings();
                setRankings(data);
            } catch (e) {
                console.error("Failed to load global rankings", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="max-w-6xl mx-auto mt-8 px-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button
                    onClick={onBack}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Trophy className="w-10 h-10 text-amber-500 drop-shadow-sm" /> Top Managers
                    </h1>
                    <p className="text-slate-500 font-medium">The most dominant teams across all leagues globally.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-600" />
                    <p className="text-lg font-bold">Scanning the multiverse for top talent...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rankings.map((entry, index) => {
                        const profile = entry.profiles;
                        const league = entry.leagues;
                        const rank = index + 1;

                        return (
                            <div
                                key={`${entry.league_id}-${entry.user_id}`}
                                className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-xl hover:border-purple-100 hover:-translate-y-0.5"
                            >
                                {/* Rank Badge */}
                                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0
                  ${rank === 1 ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' :
                                        rank === 2 ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                            rank === 3 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                                                'bg-white text-slate-400 border border-slate-100'}
                `}>
                                    {rank}
                                </div>

                                {/* Team Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: profile?.color || '#a855f7' }}
                                    >
                                        {profile?.initials || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                                            {profile?.display_name || 'Legacy Manager'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-wider">
                                                <Star className="w-3 h-3" /> {league?.name || 'Independent League'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-8 md:gap-12 px-6 md:border-l border-slate-100">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Per Show</p>
                                        <div className="flex items-center justify-center md:justify-end gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                                                {Math.floor(entry.average_per_show || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Top of Class Badge */}
                                {rank <= 3 && (
                                    <div className="absolute top-0 right-4 -translate-y-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${rank === 1 ? 'bg-amber-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-500'
                                            }`}>
                                            {rank === 1 ? 'Champion' : rank === 2 ? 'Elite' : 'Pro'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {rankings.length === 0 && (
                        <div className="bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-100 py-32 flex flex-col items-center justify-center text-slate-400">
                            <Users className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-xl font-bold">No managers have stepped up yet.</p>
                            <p className="text-sm font-medium mt-2">Start a league to claim your spot on the leaderboard!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalTeamLeaderboard;
