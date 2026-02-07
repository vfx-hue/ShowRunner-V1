
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';

const NicheFantasy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-slate-200 transition-all text-slate-500"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-white/50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

                <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                    <Trophy className="w-10 h-10 text-purple-600" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                    Niche <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Fantasy</span> Sports
                </h1>

                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                    Crafting the next generation of specialized fantasy sports experiences.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-slate-900 font-bold">Building the Future</p>
                </div>

                <div className="flex justify-center gap-4">
                    <a href="mailto:ethanmasel@gmail.com" className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform">
                        Contact Us
                    </a>
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-sm">© {new Date().getFullYear()} Niche Fantasy Sports</p>
        </div>
    );
};

export default NicheFantasy;
