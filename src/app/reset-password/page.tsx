'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirm) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('Password updated successfully!');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setStatus('error');
                setMessage(data.error);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error');
        }
    };

    if (!token) return <div style={{ color: '#ef4444', textAlign: 'center' }}>Invalid or missing token.</div>;

    if (status === 'success') {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10b981' }}>✓</div>
                <h2 style={{ marginBottom: '1rem' }}>Done!</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Your password has been reset. Redirecting to login...</p>
                <Link href="/login" className="btn btn-primary">Go to Login</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {status === 'error' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
                    {message}
                </div>
            )}

            <div>
                <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                />
            </div>

            <div>
                <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: '8px', color: 'white' }}
                />
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary"
                style={{ padding: '0.875rem', fontSize: '1rem' }}
            >
                {status === 'loading' ? 'Updating...' : 'Set New Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Set New Password</h1>
                <Suspense fallback={<div style={{ textAlign: 'center' }}>Loading...</div>}>
                    <ResetForm />
                </Suspense>
            </div>
        </main>
    );
}
