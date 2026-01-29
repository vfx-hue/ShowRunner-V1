import React, { useState } from 'react';
import { Show, Team } from '../types';
import { X, ArrowRight, AlertCircle } from 'lucide-react';

interface WaiverTransactionModalProps {
    showToAdd: Show;
    currentTeam: Team;
    onConfirm: (showToDropId: string | null) => Promise<void>;
    onClose: () => void;
    maxRosterSize?: number;
}

const WaiverTransactionModal: React.FC<WaiverTransactionModalProps> = ({
    showToAdd,
    currentTeam,
    onConfirm,
    onClose,
    maxRosterSize = 6
}) => {
    const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isRosterFull = currentTeam.roster.length >= maxRosterSize;
    const canConfirm = !isRosterFull || selectedDropId !== null;

    const handleConfirm = async () => {
        if (!canConfirm) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedDropId);
            onClose();
        } catch (e) {
            console.error(e);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Confirm Transaction
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Transaction Summary */}
                    <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Adding</span>
                            <div className="font-bold text-slate-900 truncate">{showToAdd.title}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                        <div className="flex-1 text-right">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Dropping</span>
                            <div className={`font-bold truncate ${selectedDropId ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                                {selectedDropId
                                    ? currentTeam.roster.find(s => s.id === selectedDropId)?.title
                                    : (isRosterFull ? 'Select a show...' : 'None (Open Spot)')}
                            </div>
                        </div>
                    </div>

                    {/* Alert if Roster Full */}
                    {isRosterFull && !selectedDropId && (
                        <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm border border-amber-100">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Your roster is full. You must select a show to drop to complete this transaction.</p>
                        </div>
                    )}

                    {/* Drop Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
                            Select Show to Drop {isRosterFull ? '(Required)' : '(Optional)'}
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {currentTeam.roster.map(show => (
                                <div
                                    key={show.id}
                                    onClick={() => setSelectedDropId(show.id === selectedDropId ? null : show.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedDropId === show.id
                                            ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${show.category === 'streaming' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{show.title}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{show.network}</div>
                                        </div>
                                    </div>
                                    {selectedDropId === show.id && (
                                        <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                            Dropping
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || isSubmitting}
                        className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaiverTransactionModal;
