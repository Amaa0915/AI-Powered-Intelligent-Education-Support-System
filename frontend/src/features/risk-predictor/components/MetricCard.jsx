import React from 'react';

const MetricCard = ({ icon, label, value, subtext, status, color }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Excellent': return 'bg-emerald-100 text-emerald-600';
            case 'Good': return 'bg-emerald-100 text-emerald-600';
            case 'On Track': return 'bg-emerald-100 text-emerald-600';
            case 'Average': return 'bg-yellow-100 text-yellow-600';
            case 'Poor': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getBarColor = (status) => {
        switch (status) {
            case 'Excellent': return 'bg-emerald-500';
            case 'Good': return 'bg-emerald-500';
            case 'On Track': return 'bg-emerald-500';
            case 'Average': return 'bg-yellow-500';
            case 'Poor': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    let percentage = 0;
    if (typeof value === 'string' && value.includes('%')) {
        percentage = parseInt(value);
    } else if (typeof value === 'string' && value.includes('h')) {
        percentage = (parseInt(value) / 20) * 100;
    } else {
        percentage = 80;
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>{status}</span>
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
                <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-800">{value}</span>
                    <span className="text-xs text-gray-400">{subtext}</span>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${getBarColor(status)}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export default MetricCard;
