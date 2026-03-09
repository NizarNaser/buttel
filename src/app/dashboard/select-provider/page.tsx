
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SelectProviderPage() {
    const router = useRouter();

    const providers = [
        {
            id: 'twilio',
            name: 'Twilio',
            label: 'Global & Europe',
            description: 'The world\'s leading cloud communication platform.',
            recommendedFor: ['Germany 🇩🇪', 'USA 🇺🇸', 'UK 🇬🇧', 'France 🇫🇷', 'Global 🌍'],
            features: ['Instant Activation', 'High Reliability', 'Global Numbers'],
            color: '#f22f46', // Twilio Brand Color approx
            active: true
        },
        {
            id: 'cequens',
            name: 'CEQUENS',
            label: 'Middle East & Africa',
            description: 'Specialized connectivity for the MENA region with direct operator routes.',
            recommendedFor: ['Egypt 🇪🇬', 'Saudi Arabia 🇸🇦', 'UAE 🇦🇪', 'Qatar 🇶🇦', 'Ukraine 🇺🇦'],
            features: ['Local Sender ID', 'Direct Routes', 'Arabic Support'],
            color: '#6e41bf', // Purple tone
            active: true
        },
        {
            id: 'infobip',
            name: 'Infobip',
            label: 'Enterprise Global',
            description: 'Full-stack omnichannel interaction platform.',
            recommendedFor: ['Turkey 🇹🇷', 'Eastern Europe', 'Asia'],
            features: ['Omnichannel', 'High Throughput'],
            color: '#ff5400',
            active: true
        },
        {
            id: 'kaleyra',
            name: 'Kaleyra',
            label: 'WhatsApp & Conversational',
            description: 'Secure and trusted business communication with native WhatsApp support.',
            recommendedFor: ['India 🇮🇳', 'Italy 🇮🇹', 'USA 🇺🇸'],
            features: ['WhatsApp Business', 'Verified Sender ID'],
            color: '#00B796',
            active: true
        }
    ];

    const handleSelect = (providerId: string) => {
        // Redirect to the management page with the selected provider context
        router.push(`/dashboard/manage-phone?provider=${providerId}`);
    };

    return (
        <main className="container mx-auto p-6" style={{ maxWidth: '1200px' }}>
            <div className="mb-10 text-center">
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Select Your Coverage Region</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    To ensure the highest call quality and legal compliance, please choose the provider that best matches your target audience's location.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                marginTop: '2rem'
            }}>
                {providers.map(provider => (
                    <div
                        key={provider.id}
                        className="glass card"
                        style={{
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            borderTop: `4px solid ${provider.color}`,
                            opacity: provider.active ? 1 : 0.6,
                            position: 'relative'
                        }}
                    >
                        {!provider.active && (
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#334155', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>
                                Coming Soon
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {provider.name}
                                <span style={{ fontSize: '0.8rem', fontWeight: 500, background: '#1e293b', padding: '0.2rem 0.6rem', borderRadius: '20px', color: '#94a3b8' }}>{provider.label}</span>
                            </h2>
                            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', minHeight: '3rem' }}>{provider.description}</p>
                        </div>

                        <div style={{ marginBottom: '2rem', flex: 1 }}>
                            <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Best For Region:</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {provider.recommendedFor.map(country => (
                                    <span key={country} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                        {country}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Key Advantages:</h3>
                            <ul style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                {provider.features.map(f => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => provider.active && handleSelect(provider.id)}
                            className="btn"
                            disabled={!provider.active}
                            style={{
                                background: provider.active ? provider.color : '#334155',
                                color: 'white',
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1rem',
                                opacity: provider.active ? 1 : 0.5,
                                cursor: provider.active ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {provider.active ? `Select ${provider.name}` : 'Integration Pending'}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
                    Cancel and return to dashboard
                </Link>
            </div>
        </main>
    );
}
