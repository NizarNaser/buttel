'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CallLogs from '@/components/CallLogs';
import Link from 'next/link';

export default function CompanyDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>({ payments: [], stats: null });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchProfile = async () => {
            if ((session?.user as any)?.id) {
                try {
                    const res = await fetch(`/api/companies?id=${(session?.user as any)?.id}`);
                    const data = await res.json();
                    setCompany(data);
                } catch (err) { console.error(err); } finally { setLoading(false); }
            }
        };

        const fetchAnalytics = async (id: string) => {
            try {
                const res = await fetch(`/api/admin/analytics?companyId=${id}`);
                const data = await res.json();
                setAnalytics(data);
            } catch (err) { console.error(err); }
        };

        if (status === 'authenticated') {
            const uid = (session?.user as any)?.id;
            if (uid) {
                fetchProfile();
                fetchAnalytics(uid);
            }
        }
    }, [status, session]);

    const [updating, setUpdating] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const servicesArray = typeof company.services === 'string'
                ? company.services.split(',').map((s: string) => s.trim())
                : company.services;

            await fetch('/api/companies', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: company._id,
                    ...company,
                    services: servicesArray
                })
            });
            alert('Settings updated successfully!');
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    if (status === 'loading' || loading) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Loading Dashboard...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1rem' }}>
            <header className="mobile-stack" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="glass" style={{ padding: '0.4rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src="/logo.png" alt="butTel Logo" width={48} height={48} style={{ borderRadius: '6px' }} />
                        </div>
                        <h1 className="gradient-text" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', lineHeight: '1' }}>Company Console</h1>
                    </div>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9rem' }}>Managing: {company?.name}</p>
                    <Link href="/" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span>←</span> Back to Home
                    </Link>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href={`/recharge/${company?._id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Top up Credits
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="btn" style={{ background: '#1e293b', color: 'white', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Logout</button>
                </div>
            </header>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1rem' }}>AI Credits Left</h3>
                        <div style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 800, color: (company?.credits || 0) < 5 ? '#ef4444' : '#10b981' }}>
                            {company?.credits || 0}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Minutes of voice-time</p>
                    </div>

                    <div className="glass card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Public Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <p><strong>Twilio Num:</strong> <br />
                                <span style={{ color: '#0ea5e9' }}>
                                    {company?.phoneNumber ? (
                                        <>
                                            {company.phoneNumber} <br />
                                            <Link href="/dashboard/manage-phone" style={{ fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer', color: 'white' }}>Manage</Link>
                                        </>
                                    ) : (
                                        <Link href="/dashboard/select-provider" className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#0ea5e9', display: 'inline-block', marginTop: '0.2rem' }}>
                                            Get Number
                                        </Link>
                                    )}
                                </span>
                            </p>
                            <p><strong>Original Num:</strong> <br /><span style={{ color: '#94a3b8' }}>{company?.originalPhoneNumber || 'Not Set'}</span></p>
                            <p><strong>Address:</strong> <br /><span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{company?.address || 'Not Set'}</span></p>
                            <p><strong>Sector:</strong> {company?.sector}</p>
                        </div>
                    </div>
                </aside>

                <section className="glass card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#0ea5e9' }}>🤖 AI Knowledge Base</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        Tell the AI what information to share with your customers and how to behave.
                    </p>

                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Official Business Name</label>
                                <input
                                    value={company?.name || ''}
                                    onChange={e => setCompany({ ...company, name: e.target.value })}
                                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Primary Phone Number</label>
                                <input
                                    placeholder="+1234567890"
                                    value={company?.originalPhoneNumber || ''}
                                    onChange={e => setCompany({ ...company, originalPhoneNumber: e.target.value })}
                                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Official Company Address</label>
                            <input
                                placeholder="Street, Building, City, Country"
                                value={company?.address || ''}
                                onChange={e => setCompany({ ...company, address: e.target.value })}
                                style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Company Website</label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={company?.websiteUrl || ''}
                                onChange={e => setCompany({ ...company, websiteUrl: e.target.value })}
                                style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Services Offered (Comma separated)</label>
                            <textarea
                                rows={3}
                                value={Array.isArray(company?.services) ? company.services.join(', ') : company?.services || ''}
                                onChange={e => setCompany({ ...company, services: e.target.value })}
                                style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Custom Bot Instructions</label>
                            <textarea
                                rows={4}
                                placeholder="Example: Always mention our special discount. Be very formal."
                                value={company?.assistantPrompt || ''}
                                onChange={e => setCompany({ ...company, assistantPrompt: e.target.value })}
                                style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <button disabled={updating} className="btn btn-primary" style={{ padding: '1rem', width: '100%', maxWidth: '300px' }}>
                            {updating ? 'Updating...' : 'Save Knowledge Base'}
                        </button>
                    </form>
                </section>
            </div>

            <section className="glass card" style={{ padding: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '4rem' }}>
                <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Financial History</h2>
                    <button onClick={() => window.print()} className="btn mobile-hide" style={{ background: '#10b981', color: 'white', fontSize: '0.8rem' }}>🖨️ Print Statement</button>
                </div>

                {analytics.stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <small style={{ color: '#64748b', display: 'block' }}>Total Invested</small>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>${analytics.stats.totalRechargedUSD.toFixed(2)}</span>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <small style={{ color: '#64748b', display: 'block' }}>Airtime Used</small>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{analytics.stats.totalMinutesUsed} <small>min</small></span>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <small style={{ color: '#64748b', display: 'block' }}>Credits</small>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0ea5e9' }}>{company?.credits || 0} min</span>
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'white' }}>
                        <thead style={{ borderBottom: '2px solid #1e293b', color: '#64748b' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Minutes</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.payments?.map((p: any) => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>Recharge</td>
                                    <td style={{ padding: '1rem' }}>{p.minutes} min</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981' }}>${p.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            {(!analytics.payments || analytics.payments.length === 0) && (
                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="glass card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Recent Voice Interactions</h2>
                <CallLogs companyId={company?._id} />
            </section>
        </main>
    );
}
