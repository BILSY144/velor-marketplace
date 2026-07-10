'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'

const e = React.createElement

interface Application {
    id: string
    businessName: string
    contactName: string
    contactEmail: string
    storeDescription: string | null
    country: string | null
    productCategories: string[]
    verificationStatus: string
    status: string
    createdAt: string
    rejectionReason: string | null
}

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL']

const STATUS_COLOR: { [key: string]: string } = {
    PENDING: '#FF6B00',
    APPROVED: '#00E676',
    REJECTED: '#FF1744',
}

const VERIFY_COLOR: { [key: string]: string } = {
    NOT_STARTED: '#999999',
    PENDING: '#FF6B00',
    PROCESSING: '#FF6B00',
    VERIFIED: '#00E676',
    FAILED: '#FF1744',
    CANCELED: '#999999',
    RESTRICTED: '#FF1744',
}

function daysAgo(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days <= 0) return 'today'
    if (days === 1) return '1 day ago'
    return days + ' days ago'
}

export default function AdminApplicationsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('PENDING')
    const [applications, setApplications] = useState([] as Application[])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null as string | null)
    const [actionLoading, setActionLoading] = useState(null as string | null)
    const [toast, setToast] = useState(null as { msg: string; ok: boolean } | null)
    const [rejectDialog, setRejectDialog] = useState(null as { id: string; businessName: string } | null)
    const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
        if (status === 'loading') return
        const role = (session && session.user as any || {}).role
        if (!session || role !== 'ADMIN') {
                router.push('/')
  }
  }, [session, status, router])

  useEffect(() => {
        loadApplications()
  }, [activeTab])

  async function loadApplications() {
        setLoading(true)
        setLoadError(null)
        try {
                const q = activeTab === 'ALL' ? '' : ('?status=' + activeTab)
                const res = await fetch('/api/agents/applications' + q)
                const data = await res.json()
                if (!res.ok) {
                          setLoadError(data.error || ('Request failed (' + res.status + ')'))
                          setApplications([])
                          return
                }
                setApplications(data.applications || [])
        } catch (err: any) {
                setLoadError((err && err.message) || 'Network error')
                setApplications([])
        } finally {
                setLoading(false)
        }
            }

    function showToast(msg: string, ok: boolean) {
          setToast({ msg: msg, ok: ok })
          setTimeout(() => setToast(null), 3500)
    }

  async function handleAction(id: string, action: string, reason?: string) {
        setActionLoading(id + action)
        setRejectDialog(null)
        try {
                const res = await fetch('/api/agents/applications/' + id, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: action, reason: reason }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Action failed')
                showToast(action === 'approve' ? 'Seller approved and notified' : 'Application rejected and notified', true)
                loadApplications()
        } catch (err: any) {
                showToast((err && err.message) || 'Something went wrong', false)
        } finally {
                setActionLoading(null)
        }
  }

  const role = (session && session.user as any || {}).role
    if (status === 'loading' || !session || role !== 'ADMIN') return null

  return e('div', { style: { padding: '32px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' } },

               toast ? e('div', {
                       style: {
                                 position: 'fixed', top: 24, right: 24, zIndex: 9999,
                                 background: toast.ok ? '#00E676' : '#FF1744',
                                 color: '#000000', padding: '12px 20px', borderRadius: 8,
                                 fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                       }
               }, toast.msg) : null,

               rejectDialog ? e('div', {
                       style: {
                                 position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
                       }
               },
                                      e('div', {
                                                style: {
                                                            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12,
                                                            padding: 32, maxWidth: 420, width: '90%',
                                                }
                                      },
                                                e('h3', { style: { margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 18 } }, 'Reject Application'),
                                                e('p', { style: { margin: '0 0 16px', color: '#999999', fontSize: 14 } },
                     'Reason for rejecting ',
                                   e('strong', { style: { color: '#FFFFFF' } }, rejectDialog.businessName),
                                                            ' - this is sent to the applicant.'
                                                          ),
                                                e('textarea', {
                                                            value: rejectReason,
                                                            onChange: function (ev: any) { setRejectReason(ev.target.value) },
                                                            placeholder: 'e.g. Product category not currently supported',
                                                            style: {
                                                                          width: '100%', minHeight: 80, padding: 10, borderRadius: 6,
                                                                          border: '1px solid #2A2A2A', background: '#111111', color: '#FFFFFF',
                                                                          fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 20, resize: 'vertical',
                                                            }
                                                }),
                                                e('div', { style: { display: 'flex', gap: 12 } },
                                                            e('button', {
                                                                          onClick: function () { setRejectDialog(null); setRejectReason('') },
                                                                          style: {
                                                                                          flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #2A2A2A',
                                                                                          background: 'transparent', color: '#FFFFFF', cursor: 'pointer', fontSize: 14,
                                                                          }
                                                            }, 'Cancel'),
                                                            e('button', {
                                                                          disabled: !rejectReason.trim(),
                                                                          onClick: function () { handleAction(rejectDialog.id, 'reject', rejectReason.trim()) },
                                                                          style: {
                                                                                          flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
                                                                                          background: '#FF1744', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                                                                                          opacity: rejectReason.trim() ? 1 : 0.5,
                                                                          }
                                                            }, 'Confirm Reject')
                                                          )
                                              )
                                    ) : null,

               e('div', { style: { marginBottom: 32 } },
                       e('h1', { style: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, margin: '0 0 6px' } }, 'Seller Applications'),
                       e('p', { style: { color: '#999999', margin: 0, fontSize: 14 } }, 'Review pending sign-ups before they become live sellers')
                     ),

               e('div', { style: { display: 'flex', gap: 4, marginBottom: 24, background: '#111111', padding: 4, borderRadius: 8, width: 'fit-content' } },
                       STATUS_TABS.map(function (tab) {
                                 return e('button', {
                                             key: tab,
                                             onClick: function () { setActiveTab(tab) },
                                             style: {
                                                           padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                                           background: activeTab === tab ? '#1A1A1A' : 'transparent',
                                                           color: activeTab === tab ? '#FFFFFF' : '#999999',
                                                           fontWeight: activeTab === tab ? 600 : 400,
                                                           fontSize: 13,
                                                           borderLeft: activeTab === tab ? '2px solid #FF6B00' : '2px solid transparent',
                                             }
                                 }, tab.charAt(0) + tab.slice(1).toLowerCase())
                       })
                     ),

               e('div', { style: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' } },
                       e('table', { style: { width: '100%', borderCollapse: 'collapse' } },
                                 e('thead', null,
                                             e('tr', { style: { background: '#111111' } },
                                                           ['Business', 'Country', 'Categories', 'Verification', 'Applied', 'Status', 'Actions'].map(function (h) {
                                                                           return e('th', {
                                                                                             key: h,
                                                                                             style: {
                                                                                                                 padding: '12px 16px', textAlign: 'left', fontSize: 12,
                                                                                                                 fontWeight: 600, color: '#999999', textTransform: 'uppercase',
                                                                                                                 letterSpacing: '0.05em', borderBottom: '1px solid #2A2A2A',
                                                                                               }
                                                                           }, h)
                                                           })
                                                         )
                                           ),
                                 e('tbody', null,
                                             loading ? e('tr', null, e('td', { colSpan: 7, style: { padding: 48, textAlign: 'center', color: '#999999' } }, 'Loading...'))
                                             : applications.length === 0 ? e('tr', null, e('td', { colSpan: 7, style: { padding: 48, textAlign: 'center', color: loadError ? '#FF1744' : '#999999' } },
                                                                                                         loadError ? ('Could not load applications: ' + loadError) : ('No ' + (activeTab.toLowerCase() === 'all' ? '' : activeTab.toLowerCase() + ' ') + 'applications found')
                                                                                                       ))
                                             : applications.map(function (app, i) {
                                                             return e('tr', {
                                                                               key: app.id,
                                                                               style: { borderBottom: i < applications.length - 1 ? '1px solid #2A2A2A' : 'none' }
                                                             },
                                                                                      e('td', { style: { padding: '14px 16px', fontSize: 14 } },
                                                                                                          e('div', { style: { fontWeight: 600 } }, app.businessName),
                                                                                                          e('div', { style: { fontSize: 12, color: '#999999' } }, app.contactName + ' - ' + app.contactEmail),
                                                                                                          app.storeDescription ? e('div', { style: { fontSize: 11, color: '#777', marginTop: 4, maxWidth: 260 } }, app.storeDescription) : null
                                                                                                        ),
                                                                                      e('td', { style: { padding: '14px 16px', fontSize: 13, color: '#CCCCCC' } }, app.country || '--'),
                                                                                      e('td', { style: { padding: '14px 16px', fontSize: 12, color: '#CCCCCC', maxWidth: 180 } },
                                                                                                          app.productCategories && app.productCategories.length > 0 ? app.productCategories.join(', ') : '--'
                                                                                                        ),
                                                                                      e('td', { style: { padding: '14px 16px' } },
                                                                                                          e('span', {
                                                                                                                                style: {
                                                                                                                                                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                                                                                                                                                        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                                                                                                                                                        background: (VERIFY_COLOR[app.verificationStatus] || '#999999') + '22',
                                                                                                                                                        color: VERIFY_COLOR[app.verificationStatus] || '#999999',
                                                                                                                                                        border: '1px solid ' + (VERIFY_COLOR[app.verificationStatus] || '#999999') + '44',
                                                                                                                                  }
                                                                                                            }, app.verificationStatus.replace('_', ' '))
                                                                                                        ),
                                                                                      e('td', { style: { padding: '14px 16px', fontSize: 13, color: '#999999' } },
                                                                                                          new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                                                                                          e('div', { style: { fontSize: 11, color: '#666' } }, daysAgo(app.createdAt))
                                                                                                        ),
                                                                                      e('td', { style: { padding: '14px 16px' } },
                                                                                                          e('span', {
                                                                                                                                style: {
                                                                                                                                                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                                                                                                                                                        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                                                                                                                                                        background: (STATUS_COLOR[app.status] || '#999999') + '22',
                                                                                                                                                        color: STATUS_COLOR[app.status] || '#999999',
                                                                                                                                                        border: '1px solid ' + (STATUS_COLOR[app.status] || '#999999') + '44',
                                                                                                                                  }
                                                                                                            }, app.status),
                                                                                                          app.status === 'REJECTED' && app.rejectionReason ? e('div', { style: { fontSize: 11, color: '#777', marginTop: 4, maxWidth: 180 } }, app.rejectionReason) : null
                                                                                                        ),
                                                                                      e('td', { style: { padding: '14px 16px' } },
                                                                                                          app.status === 'PENDING' ? e('div', { style: { display: 'flex', gap: 8 } },
                                                                                                                                                           e('button', {
                                                                                                                                                                                   disabled: actionLoading === app.id + 'approve',
                                                                                                                                                                                   onClick: function () { handleAction(app.id, 'approve') },
                                                                                                                                                                                   style: {
                                                                                                                                                                                                             padding: '6px 14px', borderRadius: 6, border: 'none',
                                                                                                                                                                                                             background: '#00E67622', color: '#00E676', cursor: 'pointer',
                                                                                                                                                                                                             fontWeight: 600, fontSize: 12,
                                                                                                                                                                                                             opacity: actionLoading === app.id + 'approve' ? 0.5 : 1,
                                                                                                                                                                                                           }
                                                                                                                                                             }, 'Approve'),
                                                                                                                                                           e('button', {
                                                                                                                                                                                   disabled: actionLoading === app.id + 'reject',
                                                                                                                                                                                   onClick: function () { setRejectDialog({ id: app.id, businessName: app.businessName }) },
                                                                                                                                                                                   style: {
                                                                                                                                                                                                             padding: '6px 14px', borderRadius: 6, border: '1px solid #FF174444',
                                                                                                                                                                                                             background: 'transparent', color: '#FF1744', cursor: 'pointer',
                                                                                                                                                                                                             fontWeight: 600, fontSize: 12,
                                                                                                                                                                                                             opacity: actionLoading === app.id + 'reject' ? 0.5 : 1,
                                                                                                                                                                                                           }
                                                                                                                                                             }, 'Reject')
                                                                                                                                                         ) : e('span', { style: { fontSize: 12, color: '#666' } }, '--')
                                                                                                        )
                                                                                    )
                                             })
                                           )
                               )
                     )
             )
}
