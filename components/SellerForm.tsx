'use client';
import { useState } from 'react';
type FormState = { name: string; email: string; businessName: string; country: string; description: string };
type Status = 'idle' | 'loading' | 'success' | 'error';
export default function SellerForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', businessName: '', country: '', description: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('loading');
    try {
      const res = await fetch('/api/seller/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setStatus('success'); setMessage(data.message); }
      else { setStatus('error'); setMessage(data.error || 'Something went wrong.'); }
    } catch { setStatus('error'); setMessage('Network error. Please try again.'); }
  };
  if (status === 'success') return (
    <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #00E676', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
      <p style={{ color: '#00E676', fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Application submitted</p>
      <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>{message}</p>
    </div>
  );
  const inputStyle: React.CSSProperties = { width: '100%', backgroundColor: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '14px 16px', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', color: '#999999', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' };
  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '32px' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '24px' }}>Apply to Sell</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div><label style={labelStyle}>Full Name</label><input style={inputStyle} type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Jane Smith" required /></div>
        <div><label style={labelStyle}>Email Address</label><input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="jane@example.com" required /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div><label style={labelStyle}>Business Name</label><input style={inputStyle} type="text" value={form.businessName} onChange={(e) => setForm({...form, businessName: e.target.value})} placeholder="Acme Ltd" required /></div>
        <div><label style={labelStyle}>Country</label><input style={inputStyle} type="text" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} placeholder="United Kingdom" required /></div>
      </div>
      <div style={{ marginBottom: '24px' }}><label style={labelStyle}>What do you sell?</label><textarea style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Describe your products and business..." /></div>
      {status === 'error' && <p style={{ color: '#FF1744', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '16px' }}>{message}</p>}
      <button type="submit" disabled={status === 'loading'} style={{ width: '100%', backgroundColor: status === 'loading' ? '#2A2A2A' : '#FF6B00', color: '#FFFFFF', padding: '16px', borderRadius: '8px', border: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
        {status === 'loading' ? 'Submitting...' : 'Apply Now'}
      </button>
    </form>
  );
}
