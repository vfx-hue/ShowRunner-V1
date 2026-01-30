import React from 'react';
import { Trophy, Tv, Users, Star, ArrowRight } from 'lucide-react';

interface HowToPlayProps {
    onBack: () => void;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
            >
                <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Back to Dashboard
            </button>

            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How to Play</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Welcome to the ShowRunner Fantasy League. Draft your network of TV shows, rack up viewership points, and compete to become the top executive.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">1. Join or Create a League</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Start by creating a league with friends or joining an existing one. Each league consists of rival networks competing for ratings dominance.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                        <Tv className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">2. Draft Your Loop</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Participate in a live snake draft to select your roster. You'll need to fill slots for both <strong>Cable/Broadcast</strong> and <strong>Streaming</strong> shows. Choose wisely!
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                        <Star className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">3. Score Points</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Points are based on real-world viewership. <strong>Cable/Broadcast shows earn a 1.5x multiplier</strong> on their ratings, while Streaming shows earn standard points (1x).
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                        <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">4. Win the Season</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Manage your roster throughout the season via the <strong>Waiver Wire</strong>. Drop underperforming shows and pick up breakout hits to climb the leaderboard.
                    </p>
                </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to build your network?</h2>
                    <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                        Jump into the action now and start building your TV empire.
                    </p>
                    <button
                        onClick={onBack}
                        className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg shadow-white/10"
                    >
                        Go to Dashboard
                    </button>
                </div>

                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
        </div>
    );
};

export default HowToPlay;
