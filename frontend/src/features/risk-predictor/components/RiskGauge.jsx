import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const RiskGauge = ({ riskLevel, probability, studentName, studentGrade }) => {
    const getColor = (level) => {
        switch (level) {
            case 'Low Risk': return '#10b981';
            case 'Medium Risk': return '#f59e0b';
            case 'High Risk': return '#ef4444';
            default: return '#10b981';
        }
    };

    const color = getColor(riskLevel);
    const value = probability ? probability * 100 : 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-50 rounded-full opacity-50 pointer-events-none"></div>

            <div className="flex items-center space-x-8 z-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
                            strokeDasharray={`${value * 2.51} 251`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <h2 className="text-2xl font-bold" style={{ color }}>{riskLevel?.split(" ")[0] || 'Unknown'}</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">RISK LEVEL</p>
                    </div>
                </div>

                <div className="max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Your Academic Risk Assessment
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white ml-2" style={{ backgroundColor: color }}>
                            {riskLevel || 'Unknown'}
                        </span>
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        Based on your current performance, attendance, and behavioral patterns, our AI model has
                        analyzed your risk level for the upcoming O/L examinations.
                    </p>

                    <div className="flex space-x-4">
                        <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                {studentName ? studentName.charAt(0) : 'S'}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Student</p>
                                <p className="text-sm font-bold text-gray-700">{studentName || 'Not Selected'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Grade</p>
                                <p className="text-sm font-bold text-gray-700">{studentGrade || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
