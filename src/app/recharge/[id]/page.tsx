'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function RechargePage() {
    const { id } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(50);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch(`/api/companies?id=${id}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCompany(data.find((c: any) => c._id === id));
                } else {
                    setCompany(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    const handleRecharge = async () => {
        setStatus('processing');
        // Simulate payment gateway
        setTimeout(async () => {
            try {
                const res = await fetch('/api/companies', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: company._id,
                        credits: (company.credits || 0) + amount
                    })
                });
                if (res.ok) {
                    setCompany({ ...company, credits: (company.credits || 0) + amount });
                    setStatus('success');
                }
            } catch (err) {
                console.error(err);
                setStatus('idle');
            }
        }, 2000);
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Loading payment secure gateway...</div>;
    if (!company) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Company not found.</div>;

    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Image src="/logo.png" alt="butTel" width={60} height={60} style={{ borderRadius: '12px', marginBottom: '1rem' }} />
                    <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Recharge Credits</h1>
                    <p style={{ color: '#94a3b8' }}>Account: {company.name}</p>
                </div>

                <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    <span style={{ fontSize: '0.875rem', color: '#0ea5e9', display: 'block', marginBottom: '0.5rem' }}>Current Balance</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>{company.credits || 0} <small style={{ fontSize: '1rem', color: '#94a3b8' }}>min</small></span>
                </div>

                {status === 'success' ? (
                    <div style={{ color: '#10b981', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3>Recharge Successful!</h3>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{amount} credits have been added to your account.</p>
                        <button onClick={() => setStatus('idle')} className="btn btn-primary" style={{ marginTop: '2rem' }}>Top up again</button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            {[20, 50, 100].map(val => (
                                <button key={val} onClick={() => setAmount(val)} style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #1e293b',
                                    background: amount === val ? '#0ea5e9' : '#020617',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    {val} min
                                </button>
                            ))}
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select Payment Method</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ flex: 1, padding: '1rem', border: '1px solid #1e293b', borderRadius: '8px', textAlign: 'center', opacity: 1, background: '#0f172a' }}>
                                    <span style={{ fontSize: '1.25rem' }}>💳</span>
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Stripe</p>
                                </div>
                                <div style={{ flex: 1, padding: '1rem', border: '1px solid #1e293b', borderRadius: '8px', textAlign: 'center', opacity: 0.5 }}>
                                    <span style={{ fontSize: '1.25rem' }}>🅿️</span>
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PayPal</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRecharge}
                            disabled={status === 'processing'}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {status === 'processing' ? 'Processing...' : `Pay for ${amount} Minutes`}
                        </button>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                            Secure 256-bit SSL encrypted payment.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
