import React from 'react';

const Topbar = ({ title }) => {
    return (
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-10">
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        </div>
    );
};

export default Topbar;
