'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CallLogs from '@/components/CallLogs';

const AVAILABLE_PERMISSIONS = [
    'manage_companies',
    'manage_users',
    'view_analytics',
    'manage_payments',
    'view_logs',
    'manage_settings'
];

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Data States
    const [companies, setCompanies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>({ payments: [], calls: [], stats: null });
    const [subaccountBalances, setSubaccountBalances] = useState<Record<string, string>>({});

    // UI States
    const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'notifications' | 'payments' | 'analytics' | 'settings'>('companies');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Editing States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [complianceModal, setComplianceModal] = useState<{ open: boolean, companyId: string | null }>({ open: false, companyId: null });
    const [complianceLoading, setComplianceLoading] = useState(false);

    // Filters
    const [filter, setFilter] = useState({ companyId: '', startDate: '', endDate: '' });

    // Forms
    const emptyCompanyForm = {
        name: '', phoneNumber: '', twilioSubaccountSid: '', originalPhoneNumber: '', email: '',
        sector: 'General Business', supportedLanguages: ['Arabic', 'German', 'English'],
        address: '', websiteUrl: '', services: '', assistantPrompt: '', password: '',
        features: { bookingEnabled: false, transferEnabled: false, recordingEnabled: true },
        provider: 'twilio'
    };
    const [formData, setFormData] = useState(emptyCompanyForm);

    const emptyUserForm = {
        name: '', email: '', password: '', role: 'company', permissions: [] as string[]
    };
    const [userFormData, setUserFormData] = useState(emptyUserForm);

    const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' });

    // --- Fetchers ---

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            const data = await res.json();
            const companyList = Array.isArray(data) ? data : [];
            setCompanies(companyList);
            // Fetch balances
            companyList.forEach(async (c: any) => {
                try {
                    const sidParam = c.twilioSubaccountSid ? `?sid=${c.twilioSubaccountSid}` : '';
                    const bRes = await fetch(`/api/admin/twilio-balance${sidParam}`);
                    const bData = await bRes.json();
                    if (bData.balance) {
                        setSubaccountBalances(prev => ({ ...prev, [c._id]: `${bData.balance} ${bData.currency}` }));
                    }
                } catch (e) { console.error(e); }
            });
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const fetchAnalytics = async () => {
        try {
            const params = new URLSearchParams(filter);
            const res = await fetch(`/api/admin/analytics?${params.toString()}`);
            const data = await res.json();
            setAnalytics(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCompanies();
            fetchNotifications();
            fetchAnalytics();
            fetchUsers();
            if (session?.user) {
                setProfileForm({
                    name: session.user.name || '',
                    email: session.user.email || '',
                    password: ''
                });
            }
            const interval = setInterval(fetchNotifications, 20000);
            return () => clearInterval(interval);
        }
    }, [status, filter]);

    // --- Companies Logic ---

    const handleEditCompany = (company: any) => {
        setEditingId(company._id);
        const servicesString = Array.isArray(company.services) ? company.services.join(', ') : company.services || '';
        setFormData({ ...emptyCompanyForm, ...company, services: servicesString, password: '' });
        setIsModalOpen(true);
    };

    const handleAddNewCompany = () => {
        setEditingId(null);
        setFormData(emptyCompanyForm);
        setIsModalOpen(true);
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingId ? 'PATCH' : 'POST';
        const body = {
            ...formData,
            id: editingId,
            services: formData.services.split(',').map(s => s.trim())
        };

        try {
            const res = await fetch('/api/companies', {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (res.ok) { setIsModalOpen(false); fetchCompanies(); }
        } catch (err) { console.error(err); }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await fetch('/api/companies', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive: !currentStatus })
        });
        fetchCompanies();
    };

    const handleDeleteCompany = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}" and all logs?`)) return;
        const res = await fetch(`/api/companies?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchCompanies();
    };

    const createSubaccount = async (companyId: string) => {
        if (!confirm("Create subaccount in Twilio?")) return;
        const res = await fetch('/api/admin/create-subaccount', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId })
        });
        if (res.ok) { alert('Success'); fetchCompanies(); } else alert('Failed');
    };

    const handleComplianceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setComplianceLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            const res = await fetch('/api/company/compliance/submit', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                alert('Compliance documents submitted successfully. Status: ' + data.status);
                setComplianceModal({ open: false, companyId: null });
                fetchCompanies();
            } else {
                alert('Submission failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during submission.');
        } finally {
            setComplianceLoading(false);
        }
    };

    // --- Users Logic ---

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setUserFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role || 'company',
            permissions: user.permissions || []
        });
        setIsUserModalOpen(true);
    };

    const handleAddNewUser = () => {
        setEditingUser(null);
        setUserFormData(emptyUserForm);
        setIsUserModalOpen(true);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingUser ? 'PATCH' : 'POST';
        const body = { ...userFormData, id: editingUser?._id };

        try {
            const res = await fetch('/api/admin/users', {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (res.ok) { setIsUserModalOpen(false); fetchUsers(); }
            else { const err = await res.json(); alert(err.error); }
        } catch (err) { console.error(err); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Delete this user?")) return;
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchUsers();
        else alert('Failed to delete');
    };

    const togglePermission = (perm: string) => {
        const current = userFormData.permissions;
        if (current.includes(perm)) {
            setUserFormData({ ...userFormData, permissions: current.filter(p => p !== perm) });
        } else {
            setUserFormData({ ...userFormData, permissions: [...current, perm] });
        }
    };

    // --- Profile Logic ---
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: (session?.user as any).id,
                    ...profileForm
                })
            });
            if (res.ok) alert('Profile updated');
            else alert('Failed update');
        } catch (err) { console.error(err); }
    };

    // --- Shared ---
    const markAsRead = async (id: string) => {
        await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
        fetchNotifications();
    };

    if (status === 'loading' || loading) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading Admin Panel...</div>;
    if (!session) return null;

    return (
        <main className="container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Admin Control</h1>
                    <p style={{ color: '#94a3b8' }}>System management and notifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => setActiveTab('notifications')} className="btn" style={{ background: '#1e293b', color: 'white', position: 'relative' }}>
                        🔔 <span style={{ display: 'none' }}>Notifications</span>
                        {notifications.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%' }}>{notifications.length}</span>}
                    </button>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="btn" style={{ background: '#ef4444', color: 'white' }}>Logout</button>
                </div>
            </header>

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
                {['companies', 'users', 'notifications', 'payments', 'analytics', 'settings'].map((tab: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', color: activeTab === tab ? '#0ea5e9' : '#64748b', borderBottom: activeTab === tab ? '2px solid #0ea5e9' : 'none', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {tab === 'analytics' ? '📊 Call Analytics' : tab}
                    </button>
                ))}
            </nav>

            {/* COMPANIES TAB */}
            {activeTab === 'companies' && (
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>Active Companies</h2>
                        <button className="btn btn-primary" onClick={handleAddNewCompany}>+ Add Company</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {companies.map(company => (
                            <div key={company._id} className="card glass" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ color: company.isActive ? '#0ea5e9' : '#64748b', marginBottom: '4px' }}>{company.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: company.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: company.isActive ? '#10b981' : '#ef4444',
                                                border: `1px solid ${company.isActive ? '#10b981' : '#ef4444'}`,
                                                textTransform: 'uppercase',
                                                fontWeight: 800
                                            }}>
                                                {company.isActive ? 'Active' : 'Suspended'}
                                            </span>
                                            {(company.credits || 0) <= 0 && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    color: '#ef4444',
                                                    border: '1px solid #ef4444',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 800
                                                }}>
                                                    Out of Credit
                                                </span>
                                            )}
                                            {!company.phoneNumber && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    color: '#f59e0b',
                                                    border: '1px solid #f59e0b',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 800
                                                }}>
                                                    Needs Number
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 800,
                                            color: (company.credits || 0) > 10 ? '#10b981' : (company.credits || 0) > 0 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            {company.credits || 0}
                                        </span>
                                        <small style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Credits Left</small>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📞 Twilio: <code style={{ color: '#0ea5e9' }}>{company.phoneNumber || 'Not Assigned'}</code></p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>🔗 Forward: {company.originalPhoneNumber || 'Not Linked'}</p>
                                </div>

                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#020617', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>Lifetime Usage:</span>
                                        <span style={{ color: 'white' }}>{company.totalMinutesUsed || 0} minutes</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
                                        <span style={{ color: '#64748b' }}>Twilio Account Balance:</span>
                                        <span style={{ color: subaccountBalances[company._id] ? '#10b981' : '#64748b', fontWeight: 600 }}>
                                            {subaccountBalances[company._id] || 'Fetching...'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#4b5563', marginTop: '4px' }}>
                                        {company.twilioSubaccountSid ? (
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>SID: <small style={{ color: '#64748b' }}>{company.twilioSubaccountSid}</small></span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <span style={{
                                                        color: company.twilioComplianceStatus === 'approved' ? '#10b981' : company.twilioComplianceStatus === 'pending' ? '#f59e0b' : '#64748b',
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700
                                                    }}>
                                                        Compliance: {company.twilioComplianceStatus || 'none'}
                                                    </span>
                                                    {company.twilioComplianceStatus !== 'approved' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setComplianceModal({ open: true, companyId: company._id }); }}
                                                            style={{ padding: '0px 4px', background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', border: '1px solid #0ea5e9', borderRadius: '3px', cursor: 'pointer', fontSize: '0.55rem' }}
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => createSubaccount(company._id)}
                                                    style={{ padding: '2px 8px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem' }}
                                                >
                                                    Create Subaccount
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button onClick={() => handleEditCompany(company)} className="btn" style={{ flex: '1 1 45%', background: '#1e293b', color: 'white', fontSize: '0.8rem' }}>Edit Details</button>
                                    <button onClick={() => router.push(`/recharge/${company._id}`)} className="btn" style={{ flex: '1 1 45%', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid #0ea5e9', fontSize: '0.8rem' }}>Recharge</button>
                                    <button
                                        onClick={() => toggleStatus(company._id, company.isActive)}
                                        className="btn"
                                        style={{
                                            flex: '1 1 70%',
                                            background: company.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: company.isActive ? '#ef4444' : '#10b981',
                                            border: `1px solid ${company.isActive ? '#ef4444' : '#10b981'}`,
                                            fontSize: '0.8rem',
                                            marginTop: '0.5rem'
                                        }}
                                    >
                                        {company.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCompany(company._id, company.name)}
                                        className="btn"
                                        style={{
                                            flex: '1 1 20%',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            fontSize: '0.8rem',
                                            marginTop: '0.5rem'
                                        }}
                                        title="Delete Company"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>System Users & Admins</h2>
                        <button className="btn btn-primary" onClick={handleAddNewUser}>+ Add User</button>
                    </div>
                    <div className="glass card" style={{ padding: '0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#1e293b' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Permissions</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}>{user.name}</td>
                                        <td style={{ padding: '1rem' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: user.role === 'admin' ? '#0ea5e9' : user.role === 'user' ? '#8b5cf6' : '#64748b',
                                                fontSize: '0.8rem'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {user.permissions?.join(', ') || 'None'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button onClick={() => handleEditUser(user)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => handleDeleteUser(user._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <section className="glass card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Intelligent Call Logs & Voice Analytics</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary">Export</button>
                        </div>
                    </div>
                    {analytics.stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="glass card" style={{ padding: '1.5rem', border: '1px solid #10b981' }}>
                                <small style={{ color: '#94a3b8' }}>Revenue</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>${analytics.stats.totalRechargedUSD?.toFixed(2)}</div>
                            </div>
                            <div className="glass card" style={{ padding: '1.5rem', border: '1px solid #ef4444' }}>
                                <small style={{ color: '#94a3b8' }}>Tech Cost</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>${analytics.stats.techCostUSD?.toFixed(2)}</div>
                            </div>
                            <div className="glass card" style={{ padding: '1.5rem', border: '1px solid #0ea5e9' }}>
                                <small style={{ color: '#94a3b8' }}>Total Minutes</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>{analytics.stats.totalMinutesUsed}</div>
                            </div>
                        </div>
                    )}
                    <CallLogs />
                </section>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Payment History</h2>
                    <div className="glass card" style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#1e293b' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Company</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Minutes</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.payments.map((p: any) => (
                                    <tr key={p._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{companies.find(c => c._id === p.companyId)?.name}</td>
                                        <td style={{ padding: '1rem' }}>{p.minutes}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981' }}>${p.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
                <section className="glass" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '2rem' }}>System Alerts</h2>
                    {notifications.map(n => (
                        <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#020617', marginBottom: '1rem', borderLeft: '4px solid #0ea5e9' }}>
                            <div>
                                <strong>{n.type}</strong>
                                <p>{n.message}</p>
                            </div>
                            <button onClick={() => markAsRead(n._id)}>Dismiss</button>
                        </div>
                    ))}
                </section>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <section className="glass card" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>My Profile Settings</h2>
                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Your Name</label>
                            <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white', marginTop: '0.5rem' }} />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Email Address</label>
                            <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white', marginTop: '0.5rem' }} />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Change Password</label>
                            <input type="password" placeholder="Leave empty to keep current" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: 'white', marginTop: '0.5rem' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Update Profile</button>
                    </form>
                </section>
            )}

            {/* MODALS */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass card" style={{ width: '100%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                            {editingId ? 'Edit Company Details' : 'Register New Company'}
                        </h2>

                        <form onSubmit={handleCompanySubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Left Column: Basic Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', color: '#0ea5e9' }}>Basic Information</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Login Email <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>

                                {!editingId && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sector / Industry</label>
                                    <select
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    >
                                        <option value="General Business">General Business</option>
                                        <option value="Car Dealership">Car Dealership</option>
                                        <option value="Real Estate">Real Estate</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Legal">Legal</option>
                                        <option value="Restaurant">Restaurant</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Physical Address</label>
                                    <input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Website URL</label>
                                    <input
                                        placeholder="https://..."
                                        value={formData.websiteUrl}
                                        onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Technical & AI */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', color: '#8b5cf6' }}>Telephony & AI Config</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Telephony Provider</label>
                                    <select
                                        value={formData.provider || 'twilio'}
                                        onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    >
                                        <option value="twilio">Twilio</option>
                                        <option value="cequens">CEQUENS</option>
                                        <option value="infobip">Infobip</option>
                                        <option value="kaleyra">Kaleyra</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Assigned Phone Number</label>
                                    <input
                                        placeholder="+1234567890"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Original Business Phone (Forwarding)</label>
                                    <input
                                        placeholder="+1234567890"
                                        value={formData.originalPhoneNumber}
                                        onChange={e => setFormData({ ...formData, originalPhoneNumber: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Services Offered (Comma separated)</label>
                                    <textarea
                                        placeholder="Car Sales, Maintenance, Oil Change..."
                                        value={formData.services}
                                        onChange={e => setFormData({ ...formData, services: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white', minHeight: '60px', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Custom AI Assistant Prompt</label>
                                    <textarea
                                        placeholder="You are a helpful assistant for..."
                                        value={formData.assistantPrompt}
                                        onChange={e => setFormData({ ...formData, assistantPrompt: e.target.value })}
                                        style={{ padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white', minHeight: '80px', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Full Width: Languages & Features */}
                            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Supported Languages</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        {['Arabic', 'English', 'German', 'French', 'Spanish', 'Russian'].map(lang => (
                                            <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', background: '#020617', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #1e293b', cursor: 'pointer' }}>
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
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Enabled Features</label>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.bookingEnabled}
                                                onChange={e => setFormData({ ...formData, features: { ...formData.features, bookingEnabled: e.target.checked } })}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>📅 Booking System</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.transferEnabled}
                                                onChange={e => setFormData({ ...formData, features: { ...formData.features, transferEnabled: e.target.checked } })}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>📞 Call Transfer</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.features.recordingEnabled}
                                                onChange={e => setFormData({ ...formData, features: { ...formData.features, recordingEnabled: e.target.checked } })}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>🎙️ Call Recording</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }}>{editingId ? 'Save Changes' : 'Create Company'}</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, background: '#1e293b' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isUserModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                        <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
                        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <input placeholder="Name" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} required style={{ padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            <input placeholder="Email" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} required style={{ padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            <input placeholder="Password (leave blank to keep)" type="password" value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} style={{ padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />

                            <select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} style={{ padding: '0.75rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }}>
                                <option value="company">Company</option>
                                <option value="admin">Admin</option>
                                <option value="user">User (Staff/Moderator)</option>
                            </select>

                            {userFormData.role !== 'company' && (
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Permissions</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={userFormData.permissions.includes(perm)}
                                                    onChange={() => togglePermission(perm)}
                                                />
                                                {perm.replace('_', ' ')}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {userFormData.role === 'company' && (
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Standard companies do not have actionable permissions in the admin panel. They only access their dashboard.
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save User</button>
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn" style={{ flex: 1, background: '#1e293b' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {complianceModal.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>German Regulatory Compliance</h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Submit business registration (Gewerbeanmeldung) and details for Twilio approval.
                        </p>
                        <form onSubmit={handleComplianceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="hidden" name="companyId" value={complianceModal.companyId || ''} />

                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Legal Business Name</label>
                                <input name="legalName" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Registration Number (HRB/Steuernummer)</label>
                                <input name="registrationNumber" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Business Email</label>
                                <input name="email" type="email" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Street Address</label>
                                    <input name="street" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Postcode</label>
                                    <input name="postalCode" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Business Registration Document (PDF)</label>
                                <input name="document" type="file" accept=".pdf,.png,.jpg" required style={{ width: '100%', padding: '0.6rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '4px', color: 'white' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={complianceLoading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {complianceLoading ? 'Submitting...' : 'Submit to Twilio'}
                                </button>
                                <button type="button" onClick={() => setComplianceModal({ open: false, companyId: null })} className="btn" style={{ flex: 1, background: '#1e293b' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
