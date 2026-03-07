import React, { useEffect, useRef } from 'react';
import { X, Clock, Loader, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * Reusable Prediction History Modal
 *
 * Props:
 *  isOpen       {bool}
 *  onClose      {fn}
 *  title        {string}
 *  loading      {bool}
 *  error        {string}
 *  records      {array}  — array of history entries
 *  renderRow    {fn}     — (record, index) => <tr> content
 *  columns      {string[]} — column header labels
 *  emptyText    {string}
 */
export default function HistoryModal({
    isOpen, onClose,
    title = 'Prediction History',
    loading = false,
    error = '',
    records = [],
    renderRow,
    columns = [],
    emptyText = 'No prediction history found.',
}) {
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
            <div ref={ref}
                className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
                style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.08)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">{title}</h2>
                            <p className="text-slate-500 text-xs">{records.length} records found</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <Loader size={28} className="animate-spin mb-3" />
                            <p className="text-sm">Loading history…</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <AlertCircle size={14} /> {error}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <Clock size={32} className="mb-3 opacity-40" />
                            <p className="text-sm">{emptyText}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {columns.map((col, i) => (
                                            <th key={i}
                                                className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((rec, i) => (
                                        <tr key={i} style={{ borderBottom: i < records.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                            className="hover:bg-white/[0.02] transition-colors">
                                            {renderRow(rec, i)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Tiny helper — formats ISO / Date string nicely */
export function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return iso; }
}
