export default function PrivacyPolicy() {
    return (
        <main className="container" style={{ padding: '4rem 2rem', lineHeight: '1.8' }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Last Updated: January 2026</p>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>1. Data Collection</h2>
                <p>At butTel, we collect voice recordings and transcripts to provide our AI receptionist services. This data is used solely for serving your callers and improving the service quality.</p>
            </section>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>2. How We Use Data</h2>
                <p>Your data is used to:</p>
                <ul>
                    <li>Facilitate voice interactions between AI and callers.</li>
                    <li>Generate internal call summaries for your dashboard.</li>
                    <li>Comply with German financial and privacy regulations (GDPR).</li>
                </ul>
            </section>

            <section className="glass card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>3. Data Security</h2>
                <p>We implement industry-standard encryption and security measures to protect the integrity of your voice data and company records.</p>
            </section>

            <div style={{ marginTop: '3rem' }}>
                <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Return Home</a>
            </div>
        </main>
    );
}
