import React from 'react';

const C = { navy: '#272343', mintLight: '#E3F6F5', mint: '#BAE8E8' };

const Topbar = ({ title }) => {
    return (
        <div className="h-16 flex items-center px-8 sticky top-0 z-10"
            style={{ background: C.mintLight, borderBottom: `2px solid ${C.mint}` }}>
            <h1 className="text-lg font-bold" style={{ color: C.navy }}>{title}</h1>
        </div>
    );
};

export default Topbar;
