'use client';

import { getOfficeHoursStatus } from '@/lib/assistant';
import CallLogs from '@/components/CallLogs';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const status = getOfficeHoursStatus();
  const { data: session } = useSession();

  return (
    <main className="container" style={{ paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '0.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/logo.png" alt="butTel Logo" width={80} height={80} style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '3rem', lineHeight: 1.1 }}>butTel</h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.25rem' }}>Universal AI Receptionist for Every Business</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {session ? (
              <>
                <Link href={(session.user as any).role === 'admin' ? '/admin' : '/dashboard'} className="btn" style={{ background: '#1e293b', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', borderRadius: '6px' }}>
                  {(session.user as any).role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                </Link>
                <button onClick={() => signOut()} className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '6px' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn" style={{ background: '#1e293b', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', borderRadius: '6px' }}>
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', borderRadius: '6px' }}>
                  Register Business
                </Link>
              </>
            )}
          </div>
          <div className={`status-badge ${status.isOpen ? 'status-online' : ''}`} style={{
            background: status.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.isOpen ? '#10b981' : '#ef4444',
            border: '1px solid currentColor',
            padding: '0.5rem 1rem',
            fontSize: '1rem'
          }}>
            <div className="pulse" />
            {status.isOpen ? 'Gateway Online' : 'Out of Hours'}
          </div>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{status.currentDay}, {status.currentTime} (Berlin)</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
        <section className="glass card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>🚀</div>
            <h2 style={{ color: '#0ea5e9', fontSize: '1.25rem' }}>Any Industry</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>Our AI adapts to your specific company context. Whether you run a law firm, a clinic, or a tech startup, butTel handles it all.</p>
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['Medical', 'Legal', 'Tech', 'Retail', 'Service', 'Accounting'].map(tag => (
              <span key={tag} style={{ background: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{tag}</span>
            ))}
          </div>
        </section>

        <section className="glass card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>🌐</div>
            <h2 style={{ color: '#0ea5e9', fontSize: '1.25rem' }}>Global & Local</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>Native support for high-quality interactions in multiple languages.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {['العربية', 'Deutsch', 'English', 'Français', 'Español', 'Türkçe', 'Русский', 'Українська'].map(lang => (
              <span key={lang} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.9rem' }}>{lang}</span>
            ))}
          </div>
        </section>

        <section className="glass card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>💰</div>
            <h2 style={{ color: '#0ea5e9', fontSize: '1.25rem' }}>Pay as you go</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Simple top-up system. Recharge your minutes directly and only pay for what you use.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/register" style={{ color: '#0ea5e9', fontSize: '0.9rem', textDecoration: 'none' }}>Start with 5 free minutes →</Link>
          </div>
        </section>
      </div>
      <section style={{ marginTop: '5rem', marginBottom: '5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem', color: 'white' }}>Why Choose butTel?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Smart Voice */}
          <div className="glass card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(14, 165, 233, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#0ea5e9' }}>
              🎙️
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Smart Voice Agent</h3>
            <p style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Natural Conversations</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              An AI that sounds human, understands context, and handles complex inquiries professionally in multiple languages.
            </p>
          </div>

          {/* WhatsApp Integration */}
          <div className="glass card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#22c55e' }}>
              💬
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>WhatsApp Handling</h3>
            <p style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Instant Responses</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Automatically reply to customer messages on WhatsApp 24/7 with the same intelligence as your voice agent.
            </p>
          </div>

          {/* Global Reach */}
          <div className="glass card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(249, 115, 22, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#f97316' }}>
              🌍
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Global Local Numbers</h3>
            <p style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Presence Anywhere</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Get local phone numbers in Germany, USA, UAE, Egypt, and beyond to establish a trusted local presence.
            </p>
          </div>

          {/* Business Hours */}
          <div className="glass card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#ec4899' }}>
              🕒
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>24/7 Availability</h3>
            <p style={{ color: '#ec4899', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Never Miss a Lead</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Your assistant never sleeps. Capture appointments and answer questions even when your office is closed.
            </p>
          </div>
        </div>
      </section>
      <section style={{ marginTop: '5rem', textAlign: 'center' }}>
        <div className="glass card" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 6, 23, 0.8) 100%)' }}>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>
            Elevate Your Business with Intelligent AI Reception
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: '1.8' }}>
            Never miss a lead again. butTel provides integrated solutions powered by advanced AI to answer your customers, schedule appointments, and provide professional support in multiple languages with unmatched efficiency.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
              <h3 style={{ color: '#0ea5e9', marginBottom: '1rem', fontSize: '1.2rem' }}>Human-Like AI</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Our system provides natural, intelligent responses that make customers feel they are speaking with a real expert on your business.</p>
            </div>
            <div className="glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ color: '#0ea5e9', marginBottom: '1rem', fontSize: '1.2rem' }}>24/7 Availability</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your digital receptionist works 24/7, even on weekends and holidays, ensuring total customer satisfaction around the clock.</p>
            </div>
            <div className="glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ color: '#0ea5e9', marginBottom: '1rem', fontSize: '1.2rem' }}>Smart Analytics</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Get instant reports and a deep understanding of customer needs through real-time analysis of call logs and intents.</p>
            </div>
          </div>

          <div style={{ marginTop: '4rem' }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '50px', boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}>
              Start Your Free Trial Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
