import React from 'react';
import { Bell, Trophy, Zap, AlertCircle } from 'lucide-react';

interface NotificationsDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Mock Notifications for now
    const notifications = [
        {
            id: 1,
            type: 'score',
            title: 'Scoring Updated',
            message: 'Week 4 viewership numbers are in! Check your standings.',
            time: '2 hours ago',
            read: false
        },
        {
            id: 2,
            type: 'alert',
            title: 'Waiver Wire Closing',
            message: 'Waivers will process in 3 hours. Make your final moves.',
            time: '5 hours ago',
            read: true
        },
        {
            id: 3,
            type: 'hype',
            title: 'Draft Alert',
            message: 'The draft for "Global League" has finished.',
            time: '1 day ago',
            read: true
        }
    ];

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose}></div>
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">3 New</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((note) => (
                        <div
                            key={note.id}
                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!note.read ? 'bg-purple-50/30' : ''}`}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${note.type === 'score' ? 'bg-green-100 text-green-600' :
                                        note.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                                            'bg-purple-100 text-purple-600'
                                    }`}>
                                    {note.type === 'score' ? <Trophy className="w-4 h-4" /> :
                                        note.type === 'alert' ? <AlertCircle className="w-4 h-4" /> :
                                            <Zap className="w-4 h-4" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 mb-0.5">{note.title}</p>
                                    <p className="text-xs text-slate-500 leading-snug mb-1.5">{note.message}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{note.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                        Mark all as read
                    </button>
                </div>
            </div>
        </>
    );
};

export default NotificationsDropdown;
