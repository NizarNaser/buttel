'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermsConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('buttel_terms_accepted');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('buttel_terms_accepted', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '600px',
            zIndex: 1000,
            animation: 'slideUp 0.5s ease-out'
        }}>
            <div className="glass card" style={{
                padding: '1.5rem 2rem',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '1.5rem' }}>⚖️</div>
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Terms of Service & Privacy</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
                    Welcome to butTel. By using our services, you agree to our
                    <Link href="/terms" style={{ color: '#0ea5e9', margin: '0 4px' }}>Terms of Service</Link>
                    and
                    <Link href="/privacy" style={{ color: '#0ea5e9', margin: '0 4px' }}>Privacy Policy</Link>.
                    We use cookies and AI interaction logs to improve your experience.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <Link href="/terms" className="btn" style={{ background: '#1e293b', color: '#fff', fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}>
                        Read Details
                    </Link>
                    <button onClick={handleAccept} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.6rem 2rem', fontWeight: 600 }}>
                        I Agree & Accept
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translateX(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
