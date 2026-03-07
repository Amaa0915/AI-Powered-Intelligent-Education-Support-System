import React from 'react';

const SubjectAnalysis = ({ subjects }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-gray-800 text-lg">Subject-wise Risk Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(subjects).map(([subject, score]) => (
                    <div key={subject}>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600 font-medium text-sm">{subject}</span>
                            <span className={`font-bold text-sm ${score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {score}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${score}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubjectAnalysis;
