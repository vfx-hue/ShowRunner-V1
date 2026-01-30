import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Tv, Shield, Loader2, UserMinus, Users, Trash2 } from 'lucide-react';

import { League, UserProfile } from '../types';
import * as api from '../services/api';

interface LeagueSettingsModalProps {
    league: League;
    currentUserId: string;
    onClose: () => void;
    onRefresh: () => void;
    isDraftOver?: boolean;
}

const LeagueSettingsModal: React.FC<LeagueSettingsModalProps> = ({
    league,
    currentUserId,
    onClose,
    onRefresh,
    isDraftOver = false
}) => {
    const [saving, setSaving] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formState, setFormState] = useState({
        max_members: league.max_members ?? 10,
        cable_slots: league.cable_slots ?? 3,
        streaming_slots: league.streaming_slots ?? 3,
        waiver_type: league.waiver_type || 'rolling',
        draft_start_time: '',
        waiver_cooldown_days: league.waiver_cooldown_days ?? 7,
        redraft_every_period: league.redraft_every_period ?? true
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
            max_members: league.max_members ?? 10,
            cable_slots: league.cable_slots ?? 3,
            streaming_slots: league.streaming_slots ?? 3,
            waiver_type: league.waiver_type || 'rolling',
            draft_start_time: formatForInput(league.draft_start_time),
            waiver_cooldown_days: league.waiver_cooldown_days ?? 7,
            redraft_every_period: league.redraft_every_period ?? true
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

        // Validation
        const maxMembers = Number(formState.max_members);
        const cableSlots = Number(formState.cable_slots);
        const streamingSlots = Number(formState.streaming_slots);
        const cooldown = Number(formState.waiver_cooldown_days);

        if (maxMembers < 2 || maxMembers > 20) {
            alert("League size must be between 2 and 20.");
            return;
        }
        if (cableSlots < 0 || streamingSlots < 0) {
            alert("Slots cannot be negative.");
            return;
        }
        if (cooldown < 0) {
            alert("Cooldown days cannot be negative.");
            return;
        }

        setSaving(true);
        try {
            const isoDate = formState.draft_start_time ? new Date(formState.draft_start_time).toISOString() : null;
            await api.updateLeague(league.id, {
                max_members: maxMembers,
                cable_slots: cableSlots,
                streaming_slots: streamingSlots,
                waiver_type: formState.waiver_type as any,
                draft_start_time: isoDate,
                waiver_cooldown_days: cooldown,
                redraft_every_period: formState.redraft_every_period
            });
            // Force refresh of data
            await onRefresh();
            alert("Settings saved successfully!");
            onClose();
        } catch (e: any) {
            console.error(e);
            alert(`Failed to update settings: ${e.message || "Unknown error"}`);
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

    const handleDeleteLeague = async () => {
        if (!isManager) return;

        const confirmText = "DELETE";
        const userInput = prompt(`WARNING: This will permanently delete the league and all its history.\n\nType "${confirmText}" to confirm:`);

        if (userInput !== confirmText) {
            if (userInput !== null) alert("Deletion cancelled. Text did not match.");
            return;
        }

        setIsDeleting(true);
        try {
            await api.deleteLeague(league.id);
            alert("League deleted successfully.");
            localStorage.removeItem('active_league_id');
            window.location.reload();
        } catch (e: any) {
            console.error("Failed to delete league:", e);
            alert(`Failed to delete league: ${e.message || "Unknown error"}`);
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md animate-slide-up relative my-8" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" /> League {isManager ? 'Manager Settings' : 'Settings'}
                </h2>
                <p className="text-sm text-slate-500 mb-4 border-b border-gray-100 pb-3">
                    {isManager ? 'Configure scoring and roster rules.' : 'View league rules and members.'}
                </p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">League Size</label>
                            <input
                                type="number" max={10} min={2}
                                disabled={!isManager || isDraftOver}
                                value={formState.max_members}
                                onChange={(e) => handleChange('max_members', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                        {!isDraftOver && (
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
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Tv className="w-4 h-4" /> Roster Management</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-700">Monthly Redraft</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Reset rosters every matchup period?</p>
                            </div>
                            <button
                                onClick={() => isManager && handleChange('redraft_every_period', !formState.redraft_every_period)}
                                className={`w-10 h-6 rounded-full relative transition-colors ${formState.redraft_every_period ? 'bg-purple-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formState.redraft_every_period ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
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

                                        {isManager && profile.id !== currentUserId && !isDraftOver && (
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

                    {isManager && (
                        <div className="pt-6 border-t border-gray-100 flex justify-center">
                            <button
                                onClick={handleDeleteLeague}
                                disabled={isDeleting || saving}
                                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-lg transition-all"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3 h-3" />
                                        Delete League
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeagueSettingsModal;
