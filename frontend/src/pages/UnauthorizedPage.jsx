import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
            style={{ background: '#020617' }}>
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                <ShieldOff size={40} className="text-red-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-3">Access Denied</h1>
            <p className="text-slate-400 mb-8 max-w-sm">
                You don&apos;t have permission to view this page. Please contact your administrator.
            </p>
            <Link to="/"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-medium">
                <ArrowLeft size={16} /> Back to Home
            </Link>
        </div>
    );
}
