import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Activity, Award, UserPlus } from 'lucide-react';
import client from '../../api/learningPathClient';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];
const CLUSTER_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

const Dashboard = () => {
    const [students, setStudents] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, clustersRes] = await Promise.all([
                client.get('/students'),
                client.get('/clusters')
            ]);
            setStudents(studentsRes.data);
            setClusters(clustersRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchId.trim()) {
            navigate(`/students/${searchId.trim().toUpperCase()}`);
        }
    };

    if (loading) return (
        <Layout title="Dashboard" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500">Loading Dashboard...</div>
        </Layout>
    );

    const clusterCounts = students.reduce((acc, curr) => {
        acc[curr.cluster] = (acc[curr.cluster] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(clusterCounts).map(key => ({
        name: `Cluster ${key}`,
        value: clusterCounts[key]
    }));

    const typeCounts = students.reduce((acc, curr) => {
        acc[curr.student_type] = (acc[curr.student_type] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.keys(typeCounts).map(key => ({
        name: key,
        count: typeCounts[key]
    }));

    const avgScore = (students.reduce((acc, curr) => acc + curr.avg_score, 0) / students.length).toFixed(1);

    const clusterChartData = clusters.map(c => ({
        name: `Cluster ${c.cluster}`,
        students: c.count,
        avgScore: c.avg_score,
        cluster: c.cluster
    }));

    return (
        <Layout title="Dashboard" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="card bg-white p-8 border-slate-100 text-center flex flex-col items-center justify-center group">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Users size={28} />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800">{students.length}</h2>
                        <p className="text-slate-400 uppercase tracking-widest text-xs mt-1">Total Students</p>
                    </div>
                    <div className="card bg-white p-8 border-slate-100 text-center flex flex-col items-center justify-center group">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Activity size={28} />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-800">{avgScore}%</h2>
                        <p className="text-slate-400 uppercase tracking-widest text-xs mt-1">Average Performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="card bg-white border-slate-100 p-8 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 text-slate-800 font-bold">
                            <Activity className="text-blue-500" size={20} />
                            Student Cluster Distribution
                        </h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <BarChart data={clusterChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9' }} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9' }}
                                        label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={80}>
                                        {clusterChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            {clusters.map((cluster, idx) => (
                                <div key={cluster.cluster} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[idx] }}></div>
                                        <span className="font-semibold text-slate-700 text-sm">Cluster {cluster.cluster}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Students: <span className="font-bold text-slate-700">{cluster.count}</span></p>
                                    <p className="text-xs text-slate-500">Avg Score: <span className="font-bold text-slate-700">{cluster.avg_score}%</span></p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card bg-white border-slate-100 p-8 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 text-slate-800 font-bold">
                            <Activity className="text-purple-500" size={20} />
                            Cluster Performance Breakdown
                        </h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={120} fill="#8884d8" dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card bg-white border-slate-100 p-8 shadow-sm">
                    <h3 className="mb-6 flex items-center gap-2 text-slate-800 font-bold">
                        <Award className="text-purple-500" size={20} />
                        Distribution by Student Type
                    </h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9' }} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9' }} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderRadius: '12px' }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={60}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
