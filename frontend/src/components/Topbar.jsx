import React from 'react';
import { Bell, User } from 'lucide-react';

const Topbar = ({ title }) => {
    return (
        <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 border-slate-200">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-none">Mr. S. Perera</p>
                            <span className="text-[10px] text-slate-400">Class Teacher • 11-A</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
