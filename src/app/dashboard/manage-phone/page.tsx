
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const COUNTRIES = [
    { code: 'US', name: 'United States (+1)' },
    { code: 'GB', name: 'United Kingdom (+44)' },
    { code: 'DE', name: 'Germany (+49)' },
    { code: 'CA', name: 'Canada (+1)' },
    { code: 'FR', name: 'France (+33)' },
    { code: 'IT', name: 'Italy (+39)' },
    { code: 'ES', name: 'Spain (+34)' },
    { code: 'AU', name: 'Australia (+61)' },
    { code: 'NL', name: 'Netherlands (+31)' },
    { code: 'BE', name: 'Belgium (+32)' },
    { code: 'SE', name: 'Sweden (+46)' },
    { code: 'AT', name: 'Austria (+43)' },
    { code: 'CH', name: 'Switzerland (+41)' },
    { code: 'IE', name: 'Ireland (+353)' },
    { code: 'UA', name: 'Ukraine (+380)' },
    { code: 'EG', name: 'Egypt (+20)' },
    { code: 'SA', name: 'Saudi Arabia (+966)' },
    { code: 'AE', name: 'UAE (+971)' },
    { code: 'QA', name: 'Qatar (+974)' },
    { code: 'IN', name: 'India (+91)' } // Added for Kaleyra relevance
];

function ManagePhoneContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const provider = searchParams.get('provider') || 'twilio';

    const [company, setCompany] = useState<any>(null);

    // Search State
    // Default country based on provider
    const getDefaultCountry = (prov: string) => {
        if (prov === 'cequens') return 'EG';
        if (prov === 'kaleyra') return 'IT'; // or IN
        if (prov === 'infobip') return 'TR';
        return 'DE'; // Twilio / Default
    };

    const [searchCountry, setSearchCountry] = useState(getDefaultCountry(provider));
    const [areaCode, setAreaCode] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);


    // Purchase State
    const [selectedNumber, setSelectedNumber] = useState<any>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    // Legal Entity Form
    const [formData, setFormData] = useState({
        legalName: '',
        street: '',
        city: '',
        postalCode: '',
        region: '',
        isoCountry: 'DE'
    });

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') fetchCompany();
    }, [status]);

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/companies?id=${(session?.user as any)?.id}`);
            const data = await res.json();
            setCompany(data);
            if (data.name) setFormData(prev => ({ ...prev, legalName: data.name }));
        } catch (err) { console.error(err); }
    };

    const searchNumbers = async () => {
        setSearching(true);
        setAvailableNumbers([]);
        try {
            const params = new URLSearchParams({ country: searchCountry, type: 'local' });
            if (areaCode) params.append('areaCode', areaCode);

            const res = await fetch(`/api/providers/search?${params.toString()}&provider=${provider}`);
            const data = await res.json();
            if (data.numbers) {
                setAvailableNumbers(data.numbers);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to search numbers");
        } finally {
            setSearching(false);
        }
    };

    const handleBuyClick = (num: any) => {
        setSelectedNumber(num);
        setFormData(prev => ({ ...prev, isoCountry: searchCountry }));
        setIsPurchaseModalOpen(true);
        setPurchaseError(null);
    };

    const confirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setPurchasing(true);
        setPurchaseError(null);

        try {
            const res = await fetch('/api/providers/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: company._id,
                    provider: provider, // 'twilio', 'cequens', etc.
                    phoneNumber: selectedNumber.phoneNumber,
                    friendlyName: selectedNumber.friendlyName,
                    legalName: formData.legalName,
                    address: {
                        street: formData.street,
                        city: formData.city,
                        postalCode: formData.postalCode,
                        region: formData.region,
                        isoCountry: formData.isoCountry
                    }
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || result.details || "Purchase failed");
            }

            alert('Phone Number Purchased Successfully! Configured for voice.');
            setIsPurchaseModalOpen(false);
            fetchCompany();
            setAvailableNumbers([]);
        } catch (err: any) {
            console.error(err);
            setPurchaseError(err.message);
        } finally {
            setPurchasing(false);
        }
    };

    if (status === 'loading' || !company) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Loading System...</div>;

    const inputStyle = {
        width: '100%',
        background: '#020617',
        border: '1px solid #1e293b',
        padding: '0.8rem',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        color: '#94a3b8',
        marginBottom: '0.5rem'
    };

    return (
        <main className="container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Phone Management</h1>
                    <p style={{ color: '#94a3b8' }}>Secure your dedicated line for AI reception.</p>
                </div>
                <Link href="/dashboard" className="btn" style={{ background: '#1e293b', color: 'white', textDecoration: 'none' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Current Number Status */}
            <section className="glass card" style={{ padding: '2.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '1.5rem', fontWeight: 600 }}>Active Connection</h2>

                    {company.phoneNumber ? (
                        <div>
                            <div style={{ fontSize: '3rem', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', marginBottom: '1rem' }}>
                                {company.phoneNumber}
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <span className="status-badge status-online">● Active</span>
                                <span>Voice Routing: <strong>butTel AI Agent</strong></span>
                                <span>Subaccount: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>{company.twilioSubaccountSid || 'Main'}</code></span>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>
                                No Active Line
                            </div>
                            <p style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: '1.6' }}>
                                You currently do not have a dedicated phone number. Purchase a local number below to activate your AI receptionist.
                            </p>
                        </div>
                    )}
                </div>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            </section>

            {!company.phoneNumber && (
                <section className="glass card" style={{ padding: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '2rem' }}>Acquire New Number</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'end', marginBottom: '3rem' }}>
                        <div>
                            <label style={labelStyle}>Country</label>
                            <select
                                value={searchCountry}
                                onChange={e => setSearchCountry(e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Area Code (Optional, e.g. 30 for Berlin)</label>
                            <input
                                type="text"
                                placeholder="e.g. 30"
                                value={areaCode}
                                onChange={e => setAreaCode(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={searchNumbers}
                            disabled={searching}
                            className="btn btn-primary"
                            style={{ height: '46px', padding: '0 2.5rem' }}
                        >
                            {searching ? 'Searching...' : 'Search Inventory'}
                        </button>
                    </div>

                    {availableNumbers.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {availableNumbers.map((num: any) => (
                                <div key={num.phoneNumber} style={{
                                    background: 'rgba(2, 6, 23, 0.5)',
                                    border: '1px solid #1e293b',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'border-color 0.2s'
                                }}>
                                    <div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>{num.phoneNumber}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{num.locality} {num.region}</div>
                                    </div>
                                    <button
                                        onClick={() => handleBuyClick(num)}
                                        className="btn"
                                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        Purchase
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {availableNumbers.length === 0 && !searching && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', border: '2px dashed #1e293b', borderRadius: '12px' }}>
                            Select a country and area code, then click search to find your number.
                        </div>
                    )}
                </section>
            )}

            {isPurchaseModalOpen && selectedNumber && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 100, padding: '1rem'
                }}>
                    <div className="glass card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsPurchaseModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            ×
                        </button>

                        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Confirm Ownership</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            You are purchasing <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>{selectedNumber.phoneNumber}</span> from {searchCountry}.
                        </p>

                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#93c5fd' }}>
                            <strong>⚠️ Legal Requirement:</strong> To comply with local telecommunications regulations (e.g., German TKG), you must provide a valid physical address. This address will be registered with the carrier as the legal owner's address.
                        </div>

                        {purchaseError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#fca5a5' }}>
                                <strong>Error:</strong> {purchaseError}
                            </div>
                        )}

                        <form onSubmit={confirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Legal Name (Company or Person)</label>
                                <input
                                    required
                                    value={formData.legalName}
                                    onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                                    style={inputStyle}
                                    placeholder="e.g. Acme GmbH"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Street Address</label>
                                    <input
                                        required
                                        placeholder="Musterstraße 123"
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Postal Code</label>
                                    <input
                                        required
                                        placeholder="10115"
                                        value={formData.postalCode}
                                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>City</label>
                                    <input
                                        required
                                        placeholder="Berlin"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Address Country</label>
                                    <select
                                        value={formData.isoCountry}
                                        onChange={e => setFormData({ ...formData, isoCountry: e.target.value })}
                                        style={inputStyle}
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                                        Must match the location of your legal entity.
                                    </small>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsPurchaseModalOpen(false)}
                                    className="btn"
                                    style={{ flex: 1, background: '#1e293b', color: '#cbd5e1' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={purchasing}
                                    className="btn btn-primary"
                                    style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {purchasing ? 'Processing Registration...' : (
                                        <>
                                            Confirm Purchase
                                            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>($1.15/mo)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function ManagePhonePage() {
    return (
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Loading Interface...</div>}>
            <ManagePhoneContent />
        </Suspense>
    );
}
