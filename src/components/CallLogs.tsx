'use client';

import { useEffect, useState } from 'react';

interface CallLog {
    _id: string;
    timestamp: string;
    callerId: string;
    language: string;
    intent: string;
    urgency: 'low' | 'medium' | 'high';
    status: string;
}

export default function CallLogs({ companyId }: { companyId?: string }) {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const url = companyId ? `/api/logs?companyId=${companyId}` : '/api/logs';
            const res = await fetch(url);
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [companyId]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading logs...</div>;

    return (
        <div className="glass" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.875rem' }}>
                        <th style={{ padding: '1rem' }}>Time</th>
                        <th style={{ padding: '1rem' }}>Caller ID</th>
                        <th style={{ padding: '1rem' }}>Language</th>
                        <th style={{ padding: '1rem' }}>Intent</th>
                        <th style={{ padding: '1rem' }}>Urgency</th>
                        <th style={{ padding: '1rem' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                No incoming calls recorded yet.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td style={{ padding: '1rem' }}>{log.callerId}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#334155', fontSize: '0.75rem' }}>
                                        {log.language}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{log.intent}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        color: log.urgency === 'high' ? '#ef4444' : log.urgency === 'medium' ? '#f59e0b' : '#10b981',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}>
                                        {log.urgency.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{log.status}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
