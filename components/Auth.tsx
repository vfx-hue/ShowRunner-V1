import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tv, ArrowRight, Star, Trophy, Users, X, Ticket } from 'lucide-react';

const Auth: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [message, setMessage] = useState('');
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  useEffect(() => {
    // Check for pending invite
    const invite = localStorage.getItem('pending_league_invite');
    if (invite) {
      setPendingInvite(invite);
      setMode('SIGNUP'); // Default to signup for new invitees
      setShowModal(true); // Open modal immediately
      setMessage(`You've been invited to join a league! Create an account to accept.`);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Logic to handle "admin" or simple usernames by appending a fake domain
    let emailToUse = identifier;
    if (!identifier.includes('@')) {
      emailToUse = `${identifier}@showrunner.demo`;
    }

    try {
      if (mode === 'LOGIN') {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: emailToUse,
          password,
          options: {
            data: {
              display_name: displayName || identifier.split('@')[0],
            }
          }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ShowRunner</span>
        </div>
        <button
          onClick={() => { setMode('LOGIN'); setShowModal(true); }}
          className="text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32 flex flex-col items-center text-center px-4">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-100 rounded-full blur-3xl -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-3xl -z-10 opacity-50"></div>

        {pendingInvite ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm font-bold uppercase tracking-wider mb-6 animate-bounce-subtle">
            <Ticket className="w-4 h-4" /> You have a pending league invite!
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
            <Star className="w-3 h-3" /> Season 2026 Live Now
          </div>
        )}

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl leading-tight">
          Fantasy Sports for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">TV Addicts</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
          Draft your favorite shows, track viewership ratings, and compete with friends to become the ultimate network executive.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => { setMode('SIGNUP'); setShowModal(true); }}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-lg rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5"
          >
            {pendingInvite ? 'Accept Invite & Join' : 'Start Your League'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Private Leagues</h3>
            <p className="text-slate-500 text-sm">Create a league, invite your friends, and draft shows live in a private lobby.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Scoring</h3>
            <p className="text-slate-500 text-sm">Points update weekly based on real-world Nielsen ratings and viewership data.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4 text-amber-600">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Draft Strategy</h3>
            <p className="text-slate-500 text-sm">Pick hits, avoid flops, and play the waiver wire to build a championship network.</p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {pendingInvite ? 'Join League' : (mode === 'LOGIN' ? 'Welcome Back' : 'Create Account')}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {pendingInvite
                  ? 'Sign up or login to accept your invitation'
                  : (mode === 'LOGIN' ? 'Enter your details to sign in' : 'Start your fantasy TV journey today')}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'SIGNUP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maverick"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{mode === 'LOGIN' ? 'Email or Username' : 'Email Address'}</label>
                <input
                  type="text"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {message && (
                <div className={`text-sm p-3 rounded-lg font-medium ${mode === 'SIGNUP' && !message.includes('error') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Processing...' : (pendingInvite ? 'Accept Invite' : (mode === 'LOGIN' ? 'Sign In' : 'Create Account'))}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setMessage(''); }}
                className="text-sm text-slate-500 hover:text-purple-600 font-medium transition-colors"
              >
                {mode === 'LOGIN' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;