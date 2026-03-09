'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ minHeight: '100vh', padding: '4rem 1rem 2rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block' }}>
                    but<span className="text-primary">Tel</span>
                </Link>
                <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
                    Get in Touch
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Have questions about our AI receptionists? Ready to transform your business communication? We're here to help.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Contact Info Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white' }}>Contact Information</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '0.75rem', borderRadius: '12px', fontSize: '1.25rem' }}>📍</div>
                                <div>
                                    <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Headquarters</h4>
                                    <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                                        123 Innovation Drive<br />
                                        Tech City, TC 90210<br />
                                        Germany
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', fontSize: '1.25rem' }}>📧</div>
                                <div>
                                    <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Email Us</h4>
                                    <p style={{ color: '#94a3b8' }}>support@buttel.com</p>
                                    <p style={{ color: '#94a3b8' }}>sales@buttel.com</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.75rem', borderRadius: '12px', fontSize: '1.25rem' }}>📞</div>
                                <div>
                                    <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Call Support</h4>
                                    <p style={{ color: '#94a3b8' }}>+49 123 456 789</p>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Mon-Fri, 9am - 6pm CET</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 6, 23, 0.5) 100%)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>Ready to get started?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Create your account today and set up your AI receptionist in minutes.
                        </p>
                        <Link href="/register" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                            Create Free Account
                        </Link>
                    </div>
                </div>

                {/* Form Side */}
                <div className="glass card" style={{ padding: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', color: 'white' }}>Send us a message</h2>

                    {status === 'success' ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Message Sent!</h3>
                            <p style={{ color: '#94a3b8' }}>Thank you for reaching out. We'll get back to you shortly.</p>
                            <button onClick={() => setStatus('idle')} className="btn" style={{ marginTop: '2rem', background: '#1e293b', color: 'white' }}>Send Another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your Name"
                                        style={{ width: '100%', padding: '0.875rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@company.com"
                                        style={{ width: '100%', padding: '0.875rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Subject</label>
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    style={{ width: '100%', padding: '0.875rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="" disabled>Select a topic</option>
                                    <option value="General and Sales">General Inquiry / Sales</option>
                                    <option value="Technical Support">Technical Support</option>
                                    <option value="Billing">Billing & Partnership</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="How can we help you?"
                                    style={{ width: '100%', padding: '0.875rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                                />
                            </div>

                            {status === 'error' && (
                                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                                    Something went wrong. Please try again later.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ padding: '1rem', fontWeight: 600, fontSize: '1rem' }}
                            >
                                {loading ? 'Sending Message...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
