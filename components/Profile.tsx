import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ArrowLeft, Save, User, Mail, Palette, Circle, Check, Loader2 } from 'lucide-react';
import * as api from '../services/api';

interface ProfileProps {
    user: UserProfile;
    onBack: () => void;
    onUpdate: (updatedProfile: UserProfile) => void;
}

const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b",
    "#10b981", "#06b6d4", "#3b82f6", "#1e293b", "#475569"
];

const Profile: React.FC<ProfileProps> = ({ user, onBack, onUpdate }) => {
    const [displayName, setDisplayName] = useState(user.display_name || '');
    const [email, setEmail] = useState(user.email || '');
    const [selectedColor, setSelectedColor] = useState(user.color || PRESET_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = {
                display_name: displayName,
                email: email,
                color: selectedColor,
                initials: displayName.substring(0, 2).toUpperCase()
            };

            await api.updateProfile(user.id, updates);

            onUpdate({
                ...user,
                ...updates
            });
            setSuccess(true);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-8 px-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage your profile and team appearance sitewide.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                <form onSubmit={handleSave}>
                    {/* Avatar / Visual Profile Summary */}
                    <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col items-center">
                        <div
                            className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl mb-4 transition-transform hover:scale-105"
                            style={{
                                backgroundColor: selectedColor,
                                boxShadow: `0 20px 40px -12px ${selectedColor}66`
                            }}
                        >
                            {displayName.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{displayName || 'User Name'}</h2>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Display Name */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                required
                            />
                            <p className="mt-2 text-xs text-slate-400 font-medium">This is how you'll appear on leaderboards and in leagues.</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                required
                            />
                            <p className="mt-2 text-xs text-slate-400 font-medium">Updating this will also change your login email.</p>
                        </div>

                        {/* Team Color */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Palette className="w-3.5 h-3.5" /> Team Color
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center border-4 ${selectedColor === color ? 'border-white ring-4 ring-purple-100 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    >
                                        {selectedColor === color && <Check className="w-6 h-6 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        {success ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-fade-in">
                                <Check className="w-5 h-5" />
                                Profile Updated!
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm font-medium">
                                Last updated recently
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
