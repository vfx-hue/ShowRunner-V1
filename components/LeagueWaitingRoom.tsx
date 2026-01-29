import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { Copy, Clock, Users, ArrowRight, Check, Link as LinkIcon, Settings, Calendar } from 'lucide-react';
import * as api from '../services/api';
import LeagueSettingsModal from './LeagueSettingsModal';

interface LeagueWaitingRoomProps {
  league: League;
  memberCount: number;
  onEnterDraft: () => void;
  onRefresh: () => void;
  currentUserId: string;
}

const LeagueWaitingRoom: React.FC<LeagueWaitingRoomProps> = ({ league, memberCount, onEnterDraft, onRefresh, currentUserId }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const maxMembers = league.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const isManager = league.created_by === currentUserId;
  const inviteUrl = `${window.location.origin}/?league=${league.code}`;

  // Countdown Logic
  useEffect(() => {
    if (!league.draft_start_time) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const draftTime = new Date(league.draft_start_time).getTime();
      const distance = draftTime - now;

      if (distance < 0) {
        setIsDraftReady(true);
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        setIsDraftReady(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [league.draft_start_time]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 animate-fade-in text-center relative">
      <div className="mb-8 relative">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{league.name}</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="bg-purple-100 text-purple-700 text-xs font-bold uppercase px-3 py-1 rounded-full">
            Waiting Room
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <Settings className="w-3 h-3" /> {isManager ? 'League Manager Settings' : 'View League Settings'}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8 text-left">
        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl -ml-12 -mb-12"></div>

          <div className="relative z-10 text-center">
            {!isFull ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Recruiting Owners</h2>
                <p className="text-slate-300">Share the link below to fill the league.</p>
              </>
            ) : !isDraftReady ? (
              <>
                <h2 className="text-2xl font-bold mb-2">League Full & Ready</h2>
                <p className="text-slate-300">Draft begins soon. Get your popcorn.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">It's Draft Time!</h2>
                <p className="text-emerald-300 font-medium">The draft room is officially open.</p>
              </>
            )}
          </div>
        </div>

        <div className="p-8">
          {!isFull && (
            <div className="mb-8 text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invite Friends</label>
              <div className="flex shadow-sm rounded-xl overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="bg-gray-50 border border-r-0 border-gray-300 text-slate-600 text-sm block w-full p-3 focus:outline-none font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className={`border border-l-0 border-gray-300 px-4 flex items-center gap-2 font-bold text-sm transition-colors ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                    }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Users className="w-5 h-5" />
                <span>Members Joined</span>
              </div>
              <span className={`text-xl font-bold ${isFull ? 'text-green-600' : 'text-slate-900'}`}>
                {memberCount} <span className="text-slate-400 text-base">/ {maxMembers}</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${isFull ? 'bg-green-500' : 'bg-purple-600'}`}
                style={{ width: `${(memberCount / maxMembers) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            {isFull && !isDraftReady && timeLeft && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-slate-900">{timeLeft.days}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Days</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-slate-900">{timeLeft.hours}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Hrs</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-slate-900">{timeLeft.minutes}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Mins</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 animate-pulse">
                  <div className="text-2xl font-bold text-purple-600">{timeLeft.seconds}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Secs</div>
                </div>
              </div>
            )}

            {isFull && isDraftReady && (
              <button
                onClick={onEnterDraft}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Enter Live Draft <ArrowRight className="w-6 h-6" />
              </button>
            )}

            {!isFull && (
              <button
                onClick={onRefresh}
                className="text-sm font-bold text-slate-500 hover:text-purple-600 flex items-center justify-center gap-2 w-full py-2"
              >
                <Clock className="w-4 h-4" /> Check for new members
              </button>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <LeagueSettingsModal
          league={league}
          currentUserId={currentUserId}
          onClose={() => setShowSettings(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default LeagueWaitingRoom;