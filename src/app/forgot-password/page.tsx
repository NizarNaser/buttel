'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error');
        }
    };

    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h1>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                        <p style={{ color: '#10b981', marginBottom: '2rem' }}>{message}</p>
                        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {status === 'error' && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
                                {message}
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="btn btn-primary"
                            style={{ padding: '0.875rem', fontSize: '1rem' }}
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#64748b', fontSize: '0.9rem', textDecoration: 'none' }}>Cancel</Link>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
