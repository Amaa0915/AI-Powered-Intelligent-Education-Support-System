import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const ActionPlan = ({ recommendations }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-6 flex-1">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                    <ShieldCheck className="text-emerald-500 w-6 h-6" />
                </div>

                <div className="text-white p-4 rounded-xl mb-4" style={{ backgroundColor: '#768196' }}>
                    <h4 className="font-bold text-emerald-300 mb-2">Keep Up the Good Work!</h4>
                    <p className="text-xs leading-relaxed text-gray-200">
                        Your risk factors are well managed. Continue maintaining your current performance.
                    </p>
                </div>

                {recommendations && recommendations.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {recommendations.slice(0, 2).map((rec, index) => (
                            <p key={index} className="text-xs text-gray-500 border-l-2 border-emerald-500 pl-2">{rec}</p>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100">
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center space-x-2">
                    <span>View Detailed Action Plan</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default ActionPlan;
