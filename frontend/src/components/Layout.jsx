import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children, title, searchId, setSearchId, handleSearch }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <Topbar
                    title={title}
                    searchId={searchId}
                    setSearchId={setSearchId}
                    handleSearch={handleSearch}
                />
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
