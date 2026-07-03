'use client';

import { useState, useEffect } from 'react';

type VerifyStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerifyState {
  status: VerifyStatus;
  submittedAt?: string;
  reviewedAt?: string;
  notes?: string;
  businessName?: string;
}

const ID_TYPES = ['Passport', 'National ID Card', "Driver's Licence", 'Residence Permit', 'Other Government-Issued ID'];
const BUSINESS_TYPES = ['Sole Trader / Self-Employed', 'Limited Company (Ltd)', 'Limited Liability Company (LLC)', 'Partnership', 'Public Limited Company (PLC)', 'Non-Profit / Charity', 'Other'];

export default function VerifyPage() {
  const [state, setState] = useState<VerifyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fullLegalName, setFullLegalName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('');
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [showBusiness, setShowBusiness] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [businessCountry, setBusinessCountry] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessDocUrl, setBusinessDocUrl] = useState('');

  useEffect(() => {
    fetch('/api/seller/verify')
      .then((r) => r.json())
      .then((d) => { setState(d); if (d.businessName) setShowBusiness(true); })
      .catch(() => setState({ status: 'NOT_SUBMITTED' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullLegalName, dateOfBirth, nationality, idType, idDocumentUrl, businessName: showBusiness ? businessName : undefined, businessType: showBusiness ? businessType : undefined, businessRegNumber: showBusiness ? businessRegNumber : undefined, businessCountry: showBusiness ? businessCountry : undefined, taxId: showBusiness ? taxId : undefined, businessDocUrl: showBusiness ? businessDocUrl : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setSuccess(true);
      setState({ status: 'PENDING' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;

  if (state?.status === 'APPROVED') return (
    <div className="min-h-screen bg-gray-50 py-12 px-4"><div className="max-w-xl mx-auto text-center"><div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><h1 className="text-2xl font-bold text-gray-900 mb-2">Verification complete</h1><p className="text-gray-500">Your identity has been verified. You can list products on Velor Marketplace.</p></div></div>
  );

  if (state?.status === 'PENDING' || success) return (
    <div className="min-h-screen bg-gray-50 py-12 px-4"><div className="max-w-xl mx-auto"><div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center"><div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><h1 className="text-xl font-bold text-gray-900 mb-2">Verification under review</h1><p className="text-gray-500 text-sm mb-4">Our team will review your documents within 1-2 business days.</p></div></div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller verification</h1>
          <p className="text-gray-500 text-sm">To sell on Velor Marketplace, we need to verify your identity. Upload your documents to Google Drive or Dropbox and paste the shareable link below.</p>
          {state?.status === 'REJECTED' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Verification rejected</p>
              {state.notes && <p className="text-sm text-red-700">{state.notes}</p>}
              <p className="text-sm text-red-600 mt-2">Please correct the issues above and resubmit.</p>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-900 px-6 py-4"><h2 className="text-white font-semibold text-sm">Personal identity (required)</h2><p className="text-gray-400 text-xs mt-0.5">Must match the name on your payment account</p></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Full legal name *</label><input type="text" required value={fullLegalName} onChange={(e) => setFullLegalName(e.target.value)} placeholder="As it appears on your ID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Date of birth *</label><input type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nationality *</label><input type="text" required value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. British, American" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">ID document type *</label><select required value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"><option value="">Select type...</option>{ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">ID document link *</label><input type="url" required value={idDocumentUrl} onChange={(e) => setIdDocumentUrl(e.target.value)} placeholder="https://drive.google.com/... (shareable link to your ID scan)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /><p className="text-xs text-gray-400 mt-1">Upload a clear photo of your ID and paste a shareable link here.</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setShowBusiness(!showBusiness)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
              <div><h2 className="font-semibold text-gray-900 text-sm">Business verification (optional)</h2><p className="text-gray-400 text-xs mt-0.5">Required for companies. Adds a verified business badge to your store.</p></div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showBusiness ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showBusiness && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Business name</label><input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Legal business name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Business type</label><select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"><option value="">Select type...</option>{BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Registration number</label><input type="text" value={businessRegNumber} onChange={(e) => setBusinessRegNumber(e.target.value)} placeholder="e.g. 12345678" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Country of registration</label><input type="text" value={businessCountry} onChange={(e) => setBusinessCountry(e.target.value)} placeholder="e.g. United Kingdom" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tax ID / VAT number</label><input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. GB123456789" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Business document link</label><input type="url" value={businessDocUrl} onChange={(e) => setBusinessDocUrl(e.target.value)} placeholder="Certificate of incorporation or business registration" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
              </div>
            )}
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
          <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors text-sm">{submitting ? 'Submitting...' : 'Submit for verification'}</button>
          <p className="text-center text-xs text-gray-400">Documents are reviewed by the Velor team within 1-2 business days. All information is handled securely and in accordance with our Privacy Policy.</p>
        </form>
      </div>
    </div>
  );
}
