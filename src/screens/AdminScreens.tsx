import React, { useState, useEffect } from 'react'
import { firestore } from '../firebase'
import { collection, doc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'
import { Listing } from '../types'
import { BackIcon } from '../components/Icons'
import { FormField } from './CreateScreen'

export function AdminAuthScreen({
  onAdminSignIn,
  onAdminSignUp,
  onClose
}: {
  onAdminSignIn: (email: string, pass: string) => Promise<boolean>
  onAdminSignUp: (email: string, pass: string, name: string) => Promise<void>
  onClose: () => void
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (isLogin) {
        const ok = await onAdminSignIn(email, password)
        if (!ok) {
          setError('Access denied. Your admin account is pending approval (isAdmin is false).')
        }
      } else {
        if (!name.trim()) {
          throw new Error('Name is required.')
        }
        await onAdminSignUp(email, password, name)
        setSuccess('Admin registration request submitted! An existing admin must enable isAdmin for your account.')
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-100 overflow-y-auto px-6 py-12 justify-center relative">
      <button 
        onClick={onClose} 
        className="absolute top-12 left-4 w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-transform z-10"
      >
        <BackIcon />
      </button>

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#f8fafc' }}>
            Nestly Admin
          </h2>
          <p className="text-xs mt-1 text-slate-400">
            Secure portal for space approvals & management
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={isLogin ? { background: '#4f46e5', color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' } : { color: '#94a3b8' }}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={!isLogin ? { background: '#4f46e5', color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' } : { color: '#94a3b8' }}
          >
            Request Access
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="Admin Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-800 bg-slate-900 text-white focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Email</label>
            <input
              type="email"
              placeholder="admin@nestly.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-800 bg-slate-900 text-white focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-800 bg-slate-900 text-white focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            style={{ background: '#4f46e5', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              isLogin ? 'Access Dashboard' : 'Submit Admin Request'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export function AdminDashboard({
  listings,
  onSignOut,
  onListingClick
}: {
  listings: Listing[]
  onSignOut: () => void
  onListingClick: (l: Listing) => void
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'listings' | 'users' | 'featured'>('pending')
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [rejectionModal, setRejectionModal] = useState<{ id: string } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [editListingModal, setEditListingModal] = useState<Listing | null>(null)
  const [editUserModal, setEditUserModal] = useState<{ uid: string; name: string; phone: string } | null>(null)

  // Fetch users when the Users tab becomes active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const snap = await getDocs(collection(firestore, 'profiles'))
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      setUsers(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const ref = doc(firestore, 'listings', id)
      await updateDoc(ref, { 
        status: 'active',
        rejectionReason: '',
        reviewedAt: new Date().toISOString()
      })
    } catch (e) {
      console.error(e)
      alert('Error approving listing')
    }
  }

  const triggerReject = (id: string) => {
    setRejectionReason('')
    setRejectionModal({ id })
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert('Please state a reason for rejection.')
      return
    }
    try {
      const ref = doc(firestore, 'listings', rejectionModal!.id)
      await updateDoc(ref, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        reviewedAt: new Date().toISOString()
      })
      setRejectionModal(null)
    } catch (e) {
      console.error(e)
      alert('Error rejecting listing')
    }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const ref = doc(firestore, 'listings', id)
      await updateDoc(ref, { featured: !current })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return
    try {
      await deleteDoc(doc(firestore, 'listings', id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveListingEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editListingModal) return
    try {
      const ref = doc(firestore, 'listings', editListingModal.id)
      await updateDoc(ref, {
        title: editListingModal.title,
        rent: Number(editListingModal.rent),
        bedrooms: Number(editListingModal.bedrooms),
        bathrooms: Number(editListingModal.bathrooms),
        floor: editListingModal.floor,
        available: editListingModal.available,
        description: editListingModal.description,
        street: editListingModal.street || '',
        town: editListingModal.town,
        area: editListingModal.area,
        status: editListingModal.status || 'active'
      })
      setEditListingModal(null)
    } catch (e) {
      console.error(e)
      alert('Failed to save listing edits')
    }
  }

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUserModal) return
    try {
      const ref = doc(firestore, 'profiles', editUserModal.uid)
      await updateDoc(ref, {
        name: editUserModal.name,
        phone: editUserModal.phone
      })
      setEditUserModal(null)
      fetchUsers()
    } catch (e) {
      console.error(e)
      alert('Failed to save user edits')
    }
  }

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user profile?')) return
    try {
      await deleteDoc(doc(firestore, 'profiles', uid))
      fetchUsers()
    } catch (e) {
      console.error(e)
    }
  }

  const pendingListings = listings.filter(l => l.status === 'pending' || l.status === 'rejected')
  const featuredListings = listings.filter(l => l.featured)

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden relative">
      {/* Admin Header */}
      <div className="shrink-0 bg-slate-900 text-white px-4 pt-12 pb-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-1.5">
            <span>🛡️ Nestly Control</span>
          </h1>
          <p className="text-[10px] text-slate-400">Admin Dashboard</p>
        </div>
        <button 
          onClick={onSignOut}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 flex">
        {[
          { id: 'pending', label: 'Pending', count: pendingListings.length, icon: '📋' },
          { id: 'listings', label: 'Spaces', icon: '📦' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'featured', label: 'Featured', count: featuredListings.length, icon: '⭐' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className="flex-1 py-3 text-center border-b-2 flex flex-col items-center justify-center gap-1 transition-all relative"
            style={{
              borderColor: activeTab === t.id ? '#4f46e5' : 'transparent',
              color: activeTab === t.id ? '#4f46e5' : '#64748b'
            }}
          >
            <div className="text-base flex items-center gap-1">
              <span>{t.icon}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1 translate-x-[-50%] translate-y-[50%]">
                  {t.count}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'pending' && (
          <>
            {pendingListings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm font-semibold">No unapproved space reviews!</p>
                <p className="text-xs text-slate-400 mt-1">All listings are up-to-date.</p>
              </div>
            ) : (
              pendingListings.map(l => {
                const isRejected = l.status === 'rejected'
                let badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-250'
                let badgeText = '⏳ Pending Review'
                if (isRejected) {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'
                  badgeText = '🔴 Rejected'
                }

                return (
                  <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex gap-3">
                      <img src={l.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{l.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{l.area}, {l.town}</p>
                        <p className="text-xs text-indigo-600 font-bold mt-1">₹{l.rent.toLocaleString()}/mo</p>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">Lister: {l.postedBy}</p>
                        {isRejected && l.rejectionReason && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-[10px] text-rose-700 leading-normal">
                            <span className="font-bold">Rejection Reason:</span> {l.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => onListingClick(l)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleApprove(l.id)}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl text-white shadow-sm shadow-indigo-600/10 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => triggerReject(l.id)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-xs font-semibold rounded-xl text-rose-600 border border-rose-200 transition-colors"
                      >
                        {isRejected ? 'Change Reason' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-3">
            {listings.map(l => {
              const statusVal = l.status || 'active'
              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
              if (statusVal === 'pending') badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-250'
              if (statusVal === 'rejected') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200'
              if (statusVal === 'paused') badgeColor = 'bg-slate-100 text-slate-600 border-slate-200'

              return (
                <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex gap-3">
                    <img src={l.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {statusVal.toUpperCase()}
                        </span>
                        {l.featured && (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                            ★ FEATURED
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{l.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">₹{l.rent.toLocaleString()}/mo · {l.area}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleToggleFeatured(l.id, !!l.featured)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      {l.featured ? '⭐ Unfeature' : '☆ Make Featured'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditListingModal(l)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            {loadingUsers ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading user profiles...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No users found.</div>
            ) : (
              users.map(u => (
                <div key={u.uid} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format'} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{u.name || 'Anonymous User'}</h4>
                      <p className="text-xs text-slate-500 truncate">{u.email || 'No email'}</p>
                      <p className="text-[10px] text-slate-400">{u.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setEditUserModal({ uid: u.uid, name: u.name || '', phone: u.phone || '' })}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.uid)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'featured' && (
          <>
            {featuredListings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <span className="text-3xl block mb-2">⭐</span>
                <p className="text-sm font-semibold">No featured spaces yet</p>
                <p className="text-xs text-slate-400 mt-1">Make spaces featured from the Spaces tab.</p>
              </div>
            ) : (
              featuredListings.map(l => (
                <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={l.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{l.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{l.area}, {l.town}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFeatured(l.id, true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-lg shrink-0 transition-colors border border-slate-200"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Rejection Modal Overlay */}
      {rejectionModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-40">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">State Rejection Reason</h3>
              <p className="text-xs text-slate-500 mt-1">Specify why this listing is being unapproved so the lister can make correction.</p>
            </div>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Please upload higher resolution photos of the kitchen or verify the rent amount."
              className="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs leading-relaxed focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectionModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-sm shadow-rose-600/10 transition-colors"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal Overlay */}
      {editListingModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-45">
          <form onSubmit={handleSaveListingEdit} className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl border border-slate-200 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Space Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Modify fields and press Save to update the database.</p>
            </div>

            <div className="space-y-3">
              <FormField label="Space Title">
                <input
                  type="text"
                  value={editListingModal.title}
                  onChange={e => setEditListingModal({ ...editListingModal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Rent (₹)">
                  <input
                    type="number"
                    value={editListingModal.rent}
                    onChange={e => setEditListingModal({ ...editListingModal, rent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </FormField>
                <FormField label="Status">
                  <select
                    value={editListingModal.status || 'active'}
                    onChange={e => setEditListingModal({ ...editListingModal, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 bg-white"
                  >
                    <option value="active">Active (Live)</option>
                    <option value="pending">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                    <option value="paused">Paused</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Bedrooms">
                  <input
                    type="number"
                    value={editListingModal.bedrooms}
                    onChange={e => setEditListingModal({ ...editListingModal, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </FormField>
                <FormField label="Bathrooms">
                  <input
                    type="number"
                    value={editListingModal.bathrooms}
                    onChange={e => setEditListingModal({ ...editListingModal, bathrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Town / City">
                  <input
                    type="text"
                    value={editListingModal.town}
                    onChange={e => setEditListingModal({ ...editListingModal, town: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </FormField>
                <FormField label="Area / Locality">
                  <input
                    type="text"
                    value={editListingModal.area}
                    onChange={e => setEditListingModal({ ...editListingModal, area: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                    required
                  />
                </FormField>
              </div>

              <FormField label="Description">
                <textarea
                  rows={3}
                  value={editListingModal.description}
                  onChange={e => setEditListingModal({ ...editListingModal, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs leading-relaxed focus:border-indigo-500"
                />
              </FormField>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setEditListingModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-750 shadow-sm shadow-indigo-600/10 transition-colors"
              >
                Save Edits
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal Overlay */}
      {editUserModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-45">
          <form onSubmit={handleSaveUserEdit} className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit User Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">Edit user info and click save to apply changes.</p>
            </div>

            <div className="space-y-3">
              <FormField label="User Name">
                <input
                  type="text"
                  value={editUserModal.name}
                  onChange={e => setEditUserModal({ ...editUserModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                  required
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="text"
                  value={editUserModal.phone}
                  onChange={e => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500"
                  required
                />
              </FormField>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUserModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-750 shadow-sm shadow-indigo-600/10 transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
