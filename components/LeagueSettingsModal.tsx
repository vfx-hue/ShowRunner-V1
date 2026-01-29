import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Tv, Shield, Loader2, UserMinus, Users } from 'lucide-react';
import { League, UserProfile } from '../types';
import * as api from '../services/api';

interface LeagueSettingsModalProps {
    league: League;
    currentUserId: string;
    onClose: () => void;
    onRefresh: () => void;
}

const LeagueSettingsModal: React.FC<LeagueSettingsModalProps> = ({
    league,
    currentUserId,
    onClose,
    onRefresh
}) => {
    const [saving, setSaving] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

    const [formState, setFormState] = useState({
        max_members: league.max_members || 4,
        cable_slots: league.cable_slots || 3,
        streaming_slots: league.streaming_slots || 3,
        waiver_type: league.waiver_type || 'rolling',
        draft_start_time: ''
    });

    const isManager = league.created_by === currentUserId;

    const formatForInput = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    useEffect(() => {
        setFormState({
            max_members: league.max_members || 4,
            cable_slots: league.cable_slots || 3,
            streaming_slots: league.streaming_slots || 3,
            waiver_type: league.waiver_type || 'rolling',
            draft_start_time: formatForInput(league.draft_start_time)
        });
    }, [league]);

    useEffect(() => {
        const loadMembers = async () => {
            setLoadingMembers(true);
            try {
                const memberIds = await api.fetchLeagueMembers(league.id);
                const profiles = await api.fetchProfiles(memberIds);
                setMemberProfiles(profiles);
            } catch (e) {
                console.error("Failed to load member profiles:", e);
            } finally {
                setLoadingMembers(false);
            }
        };
        loadMembers();
    }, [league.id]);

    const handleChange = (field: string, value: any) => {
        if (!isManager) return;
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSettings = async () => {
        if (!isManager) return;
        setSaving(true);
        try {
            const isoDate = formState.draft_start_time ? new Date(formState.draft_start_time).toISOString() : null;
            await api.updateLeague(league.id, {
                max_members: Number(formState.max_members),
                cable_slots: Number(formState.cable_slots),
                streaming_slots: Number(formState.streaming_slots),
                waiver_type: formState.waiver_type as any,
                draft_start_time: isoDate
            });
            onRefresh();
            onClose();
        } catch (e) {
            alert("Failed to update settings.");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!isManager) return;
        if (!window.confirm("Are you sure you want to remove this member? This will also delete their draft picks.")) return;

        setRemovingMemberId(userId);
        try {
            await api.removeLeagueMember(league.id, userId);
            // Refresh local member list
            setMemberProfiles(prev => prev.filter(p => p.id !== userId));
            onRefresh();
        } catch (e) {
            alert("Failed to remove member.");
            console.error(e);
        } finally {
            setRemovingMemberId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-slide-up relative my-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" /> League {isManager ? 'Manager Settings' : 'Settings'}
                </h2>
                <p className="text-sm text-slate-500 mb-6 border-b border-gray-100 pb-4">
                    {isManager ? 'Configure scoring and roster rules.' : 'View league rules and members.'}
                </p>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">League Size</label>
                            <input
                                type="number" max={10} min={2}
                                disabled={!isManager}
                                value={formState.max_members}
                                onChange={(e) => handleChange('max_members', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Draft Time</label>
                            <input
                                type="datetime-local"
                                disabled={!isManager}
                                value={formState.draft_start_time}
                                onChange={(e) => handleChange('draft_start_time', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-xs font-bold disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Tv className="w-4 h-4" /> Roster Slots</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cable Slots</label>
                                <input
                                    type="number"
                                    disabled={!isManager}
                                    value={formState.cable_slots}
                                    onChange={(e) => handleChange('cable_slots', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Streaming Slots</label>
                                <input
                                    type="number"
                                    disabled={!isManager}
                                    value={formState.streaming_slots}
                                    onChange={(e) => handleChange('streaming_slots', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> Waiver Type</label>
                        <select
                            disabled={!isManager}
                            value={formState.waiver_type}
                            onChange={(e) => handleChange('waiver_type', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
                        >
                            <option value="rolling">Rolling Priority</option>
                            <option value="faab">FAAB</option>
                            <option value="fcfs">First Come First Served</option>
                        </select>
                    </div>

                    {/* Member List Section */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> League Members</h3>
                        {loadingMembers && memberProfiles.length === 0 ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {memberProfiles.map(profile => (
                                    <div key={profile.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                                                style={{ backgroundColor: profile.color }}
                                            >
                                                {profile.initials}
                                            </div>
                                            <div className="text-xs font-bold text-slate-900 leading-none">
                                                {profile.display_name} {profile.id === currentUserId && '(You)'}
                                            </div>
                                        </div>

                                        {isManager && profile.id !== currentUserId && (
                                            <button
                                                onClick={() => handleRemoveMember(profile.id)}
                                                disabled={!!removingMemberId}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Remove Member"
                                            >
                                                {removingMemberId === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                                                ) : (
                                                    <UserMinus className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {isManager && (
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeagueSettingsModal;
