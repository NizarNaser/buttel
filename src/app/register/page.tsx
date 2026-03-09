'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        supportedLanguages: ['English'],
        address: '',
        originalPhoneNumber: ''
    });
    const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                setStep('verify');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, code }),
            });
            const data = await res.json();

            if (res.ok) {
                setStep('success');
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', position: 'relative' }}>
                <Link href="/" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Back
                </Link>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div className="glass" style={{ padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/logo.png" alt="butTel Logo" width={60} height={60} style={{ borderRadius: '6px' }} />
                    </div>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    {step === 'register' ? 'Register Company' : 'Verify Email'}
                </h1>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {step === 'register' ? (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input
                            placeholder="Business Name"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                        />
                        <input
                            type="email"
                            placeholder="Business Email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                        />
                        <input
                            type="password"
                            placeholder="Create Password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                        />
                        <input
                            placeholder="Company Physical Address"
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                        />
                        <input
                            placeholder="Current Business Phone (for forwarding)"
                            required
                            value={formData.originalPhoneNumber}
                            onChange={e => setFormData({ ...formData, originalPhoneNumber: e.target.value })}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                        />

                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Select AI Languages</label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#020617', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#94a3b8' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.supportedLanguages.includes(lang)}
                                            onChange={e => {
                                                const newLangs = e.target.checked
                                                    ? [...formData.supportedLanguages, lang]
                                                    : formData.supportedLanguages.filter(l => l !== lang);
                                                setFormData({ ...formData, supportedLanguages: newLangs });
                                            }}
                                        />
                                        {lang}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: '#020617', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                <input
                                    type="checkbox"
                                    required
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                />
                                <span style={{ fontSize: '0.8rem' }}>
                                    I agree to the <Link href="/terms" target="_blank" style={{ color: '#0ea5e9' }}>Terms of Service</Link> and Privacy Policy.
                                </span>
                            </label>
                        </div>

                        <button disabled={loading} className="btn btn-primary" style={{ padding: '0.875rem' }}>
                            {loading ? 'Sending Code...' : 'Register Now'}
                        </button>
                    </form>
                ) : step === 'verify' ? (
                    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center' }}>We sent a 6-digit code to {formData.email}</p>
                        <input
                            placeholder="6-Digit Code"
                            required
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white', letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem' }}
                        />
                        <button disabled={loading} className="btn btn-primary" style={{ padding: '0.875rem' }}>
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⏳</div>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Account Verified!</h2>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            Thank you for registering. Our team is now assigning your dedicated AI phone number.
                            <br /><br />
                            <strong style={{ color: '#0ea5e9' }}>Process will be completed within 24 hours.</strong>
                            <br /><br />
                            You will receive an email once your service is activated.
                        </p>
                        <button onClick={() => router.push('/login')} className="btn" style={{ marginTop: '2rem', width: '100%', background: '#1e293b', color: 'white' }}>
                            Go to Login
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                    Already have an account? <Link href="/login" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </main>
    );
}
