import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { Copy, Clock, Users, ArrowRight, Check, Link as LinkIcon, Settings, Save, X, Calendar, Sliders, Shield, Tv } from 'lucide-react';
import * as api from '../services/api';

interface LeagueWaitingRoomProps {
  league: League;
  memberCount: number;
  onEnterDraft: () => void;
  onRefresh: () => void;
  currentUserId: string;
}

const LeagueWaitingRoom: React.FC<LeagueWaitingRoomProps> = ({ league, memberCount, onEnterDraft, onRefresh, currentUserId }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    max_members: league.max_members || 4,
    cable_slots: league.cable_slots || 3,
    streaming_slots: league.streaming_slots || 3,
    network_multiplier: league.network_multiplier || 1.5,
    waiver_type: league.waiver_type || 'rolling',
    draft_start_time: ''
  });

  const maxMembers = league.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const isManager = league.created_by === currentUserId;
  const inviteUrl = `${window.location.origin}/?league=${league.code}`;

  // Helper to format Date for <input type="datetime-local" />
  const formatForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  // Sync form with league data on load or modal open
  useEffect(() => {
    setFormState({
        max_members: league.max_members || 4,
        cable_slots: league.cable_slots || 3,
        streaming_slots: league.streaming_slots || 3,
        network_multiplier: league.network_multiplier || 1.5,
        waiver_type: league.waiver_type || 'rolling',
        draft_start_time: formatForInput(league.draft_start_time)
    });
  }, [league, showSettings]);

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

  const handleChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
  setSaving(true);
  try {
    const isoDate = formState.draft_start_time ? new Date(formState.draft_start_time).toISOString() : null;
    
    // 1. Send the update to Supabase
    await api.updateLeague(league.id, {
      max_members: Number(formState.max_members),
      cable_slots: Number(formState.cable_slots),
      streaming_slots: Number(formState.streaming_slots),
      network_multiplier: Number(formState.network_multiplier),
      waiver_type: formState.waiver_type as any,
      draft_start_time: isoDate
    });

    // 2. MANUALLY UPDATE THE LOCAL OBJECT
    // This forces the progress bar and member count to re-calculate immediately
    league.max_members = Number(formState.max_members);
    league.draft_start_time = isoDate;

    setShowSettings(false);
    onRefresh(); // Still call this to sync with the parent/other users
  } catch (e) {
    alert("Failed to update settings.");
    console.error(e);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 animate-fade-in text-center relative">
      <div className="mb-8 relative">
         <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{league.name}</h1>
         <div className="flex items-center justify-center gap-2">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold uppercase px-3 py-1 rounded-full">
                Waiting Room
            </span>
            {isManager && (
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                <Settings className="w-3 h-3" /> League Manager Settings
              </button>
            )}
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
                  className={`border border-l-0 border-gray-300 px-4 flex items-center gap-2 font-bold text-sm transition-colors ${
                    copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-slide-up relative my-8">
             <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
             </button>

             <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
               <Settings className="w-5 h-5 text-purple-600" /> League Manager Settings
             </h2>
             <p className="text-sm text-slate-500 mb-6 border-b border-gray-100 pb-4">Configure scoring and roster rules.</p>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">League Size</label>
                        <input 
                            type="number" max={10} min={2}
                            value={formState.max_members}
                            onChange={(e) => handleChange('max_members', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Draft Time</label>
                        <input 
                            type="datetime-local" 
                            value={formState.draft_start_time}
                            onChange={(e) => handleChange('draft_start_time', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-xs font-bold"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Tv className="w-4 h-4" /> Roster Slots</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cable Slots</label>
                            <input type="number" value={formState.cable_slots} onChange={(e) => handleChange('cable_slots', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Streaming Slots</label>
                            <input type="number" value={formState.streaming_slots} onChange={(e) => handleChange('streaming_slots', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2"><Sliders className="w-4 h-4" /> Scoring Balancer</h3>
                    <div className="flex items-center gap-3">
                        <input type="number" step="0.1" value={formState.network_multiplier} onChange={(e) => handleChange('network_multiplier', e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-purple-200 text-sm font-bold text-purple-700" />
                        <span className="text-xs text-purple-600 font-medium">x Boost for Broadcast shows</span>
                    </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> Waiver Type</label>
                   <select value={formState.waiver_type} onChange={(e) => handleChange('waiver_type', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm bg-white">
                      <option value="rolling">Rolling Priority</option>
                      <option value="faab">FAAB</option>
                      <option value="fcfs">First Come First Served</option>
                   </select>
                </div>

                <button onClick={handleSaveSettings} disabled={saving} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                  {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueWaitingRoom;