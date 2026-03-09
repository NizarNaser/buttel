'use client';

import { useRouter } from 'next/navigation';

export default function TermsOfService() {
    const router = useRouter();

    const handleAccept = () => {
        localStorage.setItem('buttel_terms_accepted', 'true');
        router.push('/');
    };

    return (
        <main className="container" style={{ padding: '4rem 2rem', lineHeight: '1.8', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '2rem' }}>
                <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '1rem' }}>← Back to Home</a>
            </div>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', marginTop: '1rem' }}>Terms of Service</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Last Updated: January 2026</p>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
                <p>By using butTel, you agree to these terms. Our service provides an AI-based virtual receptionist for authorized business use only.</p>
            </section>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>2. Professional Disclaimer</h2>
                <p>butTel is an AI tool and **does not provide legal or tax advice**. Decisions made based on AI interactions are the sole responsibility of the user. We recommend consulting with human specialists for critical financial matters.</p>
            </section>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>3. Service Limitations</h2>
                <p>While we strive for 100% accuracy, AI models may occasionally produce incorrect information. We are not liable for errors in transcription or language detection.</p>
            </section>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>4. Phone Number Ownership & Regulatory Compliance</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p><strong>4.1 Role of butTel:</strong> butTel acts solely as a <strong>Technical Facilitator (Software-as-a-Service)</strong>. We provide the dashboard and AI infrastructure to manage your communications. We do not act as a primary telecommunications carrier.</p>

                    <p><strong>4.2 Ownership & Registration:</strong> Any phone number acquired through our platform is purchased specifically for you.
                        <br />- A dedicated <strong>Twilio Subaccount</strong> is created in your name (or your company's name).
                        <br />- You are the <strong>Legal Owner</strong> of the phone number.
                        <br />- We legally register the number using the physical address and identity documents you provide.</p>

                    <p><strong>4.3 Your Responsibilities:</strong> You guarantee that all information provided for number registration (Business Name, Address, etc.) is accurate and up-to-date.
                        <br />- Only German residents/companies with a valid German address may purchase German local numbers.
                        <br />- Using false information violates the German Telecommunications Act (TKG) and will result in immediate termination of service.</p>
                </div>
            </section>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem' }}>
                <button
                    onClick={handleAccept}
                    className="btn btn-primary"
                    style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                    I Accept These Terms
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="btn"
                    style={{ background: '#1e293b', color: 'white', padding: '1rem 2rem', borderRadius: '8px' }}
                >
                    Return Home
                </button>
            </div>
        </main>
    );
}
