import React from 'react';
import { Bell, User } from 'lucide-react';

const Topbar = ({ title }) => {
    return (
        <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>


        </div>
    );
};

export default Topbar;
