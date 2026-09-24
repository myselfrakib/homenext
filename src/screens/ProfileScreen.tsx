import React, { useState, useRef, useEffect } from 'react'
import { storage } from '../firebase'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Listing, Conversation, Screen } from '../types'
import { VerifiedIcon } from '../components/Icons'

export function ProfileScreen({ 
  user, 
  userProfile, 
  listings, 
  conversations,
  passVouchers = 0,
  hasBrokerService = false,
  onUpdateProfile,
  onSignOut,
  onAuthTrigger,
  onListingClick,
  onCreateClick,
  onDeleteListing,
  onToggleListingStatus,
  onScreenNav,
  onEditListing
}: { 
  user: any; 
  userProfile: any; 
  listings: Listing[]; 
  conversations: Conversation[];
  passVouchers?: number;
  hasBrokerService?: boolean;
  onUpdateProfile: (profile: any) => Promise<void>;
  onSignOut: () => void;
  onAuthTrigger: () => void;
  onListingClick?: (l: Listing) => void;
  onCreateClick?: () => void;
  onDeleteListing?: (id: string) => Promise<void>;
  onToggleListingStatus?: (id: string, currentStatus: string) => Promise<void>;
  onScreenNav?: (screen: Screen) => void;
  onEditListing?: (l: Listing) => void;
}) {
  const [notifications, setNotifications] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [name, setName] = useState(userProfile?.name || '')
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [avatar, setAvatar] = useState(userProfile?.avatar || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const storagePath = `avatars/${user.uid}_${Date.now()}`
      const fileRef = sRef(storage, storagePath)
      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)
      setAvatar(downloadUrl)
      setSuccess('Photo uploaded successfully! Save changes to sync.')
    } catch (err: any) {
      console.error(err)
      setError('Failed to upload profile photo.')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setPhone(userProfile.phone || '')
      setAvatar(userProfile.avatar || '')
    }
  }, [userProfile])

  const myListings = listings.filter(l => {
    if (user?.uid && l.postedByUid && l.postedByUid === user.uid) return true
    if (userProfile?.name && userProfile.name !== 'Guest User' && l.postedBy && l.postedBy.toLowerCase().trim() === userProfile.name.toLowerCase().trim()) return true
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem('nestly_my_listing_ids') || '[]')
      if (myIds.includes(l.id)) return true
    } catch (e) {}
    return false
  })

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    try {
      await onUpdateProfile({ name, phone, avatar })
      setSuccess('Profile updated successfully!')
      setIsEditMode(false)
    } catch (e: any) {
      setError(e.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setDeletingId(id)
      try {
        if (onDeleteListing) {
          await onDeleteListing(id)
          setSuccess(`Listing "${title}" deleted.`)
        }
      } catch (err: any) {
        setError(err.message || "Failed to delete listing.")
      } finally {
        setDeletingId(null)
      }
    }
  }

  const stats = [
    { label: 'My Listings', val: myListings.length.toString() },
    { label: 'Active Chats', val: conversations.length.toString() },
    { label: 'Total Views', val: (myListings.length * 48).toString() },
  ]

  const inp = "w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
  const inpStyle = { background: '#fff', border: '1px solid #e2ddd8', color: '#141414' }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#f7f5f1' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center relative">
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className="absolute top-12 right-4 text-xs font-bold text-forest"
        >
          {isEditMode ? 'Cancel' : 'Edit profile'}
        </button>

        <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 flex items-center justify-center text-stone-400" style={{ borderColor: '#eaf2ec', background: '#e2ddd8' }}>
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}

          {isEditMode && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white active:bg-black/70 transition-colors"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                </>
              )}
            </button>
          )}
        </div>

        {isEditMode && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>{userProfile?.name || name || user?.displayName || 'User'}</h2>
        <p className="text-sm" style={{ color: '#7a7570' }}>{userProfile?.phone || phone || 'No phone number'} {(userProfile?.email || user?.email) ? `· ${userProfile?.email || user?.email}` : ''}</p>
        <div className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>
          <VerifiedIcon /> {user?.isAnonymous ? 'Guest session' : 'Verified profile'}
        </div>
      </div>

      {error && <div className="mx-4 mb-3 p-3 rounded-xl text-xs font-semibold" style={{ background: '#fdf0e8', color: '#d4652a' }}>{error}</div>}
      {success && <div className="mx-4 mb-3 p-3 rounded-xl text-xs font-semibold" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>{success}</div>}

      {isEditMode && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white border border-stone-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Edit Profile</h3>
          <input className={inp} style={inpStyle} placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} />
          <input className={inp} style={inpStyle} placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
          <button 
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1a3d2b' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {user?.isAnonymous && !isEditMode && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white border border-stone-200">
          <p className="text-xs mb-3" style={{ color: '#7a7570' }}>
            You are currently signed in as a guest. Create an account to sync your active listings and chat logs.
          </p>
          <button 
            onClick={onAuthTrigger}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm active:scale-98 transition-all"
            style={{ background: '#1a3d2b' }}
          >
            Sign In / Register
          </button>
        </div>
      )}

      {!isEditMode && (
        <div className="mx-4 mb-4 grid grid-cols-3 rounded-2xl overflow-hidden" style={{ border: '1px solid #e2ddd8', background: '#fff' }}>
          {stats.map(({ label, val }, i) => (
            <div
              key={label}
              className="flex flex-col items-center py-4"
              style={i < 2 ? { borderRight: '1px solid #e2ddd8' } : {}}
            >
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>{val}</p>
              <p className="text-xs" style={{ color: '#7a7570' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Nestly Premium & Tokens Card */}
      {!isEditMode && (
        <div className="mx-4 mb-6 p-4 rounded-3xl bg-gradient-to-br from-[#1a3d2b] to-[#11291d] text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                🪙
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Nestly Premium & Tokens</h3>
                <p className="text-[11px] text-emerald-200">Lister contact access & flat visits</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-amber-300">{passVouchers}</span>
              <p className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">Tokens Left</p>
            </div>
          </div>

          <div className="mb-3 py-2 px-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span>🤝</span>
              <span className="text-emerald-100 font-medium">Standard ₹2,000 Brokerage Post-Visit</span>
            </div>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full">New Policy</span>
          </div>

          <div className="pt-2.5 border-t border-white/15 flex items-center gap-2">
            <button
              onClick={() => onScreenNav?.('pass')}
              className="flex-1 py-2.5 rounded-xl bg-white text-[#1a3d2b] text-xs font-bold shadow-sm active:scale-98 transition-transform text-center"
            >
              {passVouchers > 0 ? '+ Add More Tokens' : '⚡ Buy Tokens (from ₹499)'}
            </button>
            <button
              onClick={() => onScreenNav?.('pass')}
              className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold active:scale-98 transition-transform"
            >
              Pay Brokerage (₹2k)
            </button>
          </div>
        </div>
      )}

      {/* Manage My Listings section */}
      {!isEditMode && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Manage My Listings</h3>
              <p className="text-[11px] text-stone-500 font-medium">View, pause, or remove your properties</p>
            </div>
            {onCreateClick && (
              <button
                onClick={onCreateClick}
                className="px-3 py-1.5 rounded-xl bg-[#1a3d2b] text-white text-xs font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1"
              >
                <span>+ Post New</span>
              </button>
            )}
          </div>

          {myListings.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                🏠
              </div>
              <p className="text-sm font-bold text-stone-900 mb-1">No active listings yet</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
                Leaving your flat? Post a listing to connect with verified renters.
              </p>
              {onCreateClick && (
                <button
                  onClick={onCreateClick}
                  className="px-4 py-2 rounded-xl bg-[#1a3d2b] text-white text-xs font-bold shadow-md active:scale-95 transition-transform inline-flex items-center gap-1.5"
                >
                  <span>Post Your First Listing</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map(l => {
                const statusVal = l.status || 'active'
                const isPaused = statusVal === 'paused'
                const isPending = statusVal === 'pending'
                const isRejected = statusVal === 'rejected'
                
                let badgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                let badgeText = '🟢 Live'
                if (isPaused) {
                  badgeClass = 'bg-amber-100 text-amber-900 border border-amber-200'
                  badgeText = '⏸ Paused'
                } else if (isPending) {
                  badgeClass = 'bg-yellow-100 text-yellow-900 border border-yellow-250'
                  badgeText = '🟡 Pending Approval'
                } else if (isRejected) {
                  badgeClass = 'bg-rose-100 text-rose-900 border border-rose-200'
                  badgeText = '🔴 Rejected'
                }

                return (
                  <div key={l.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img src={l.imageUrl} alt={l.title} className="w-16 h-16 rounded-xl object-cover bg-stone-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <span className="text-[11px] text-stone-500 font-medium">Floor {l.floor}</span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-900 truncate">{l.title}</h4>
                        <p className="text-xs text-stone-600 font-medium">{l.area}, {l.town} · <span className="font-bold text-emerald-900">₹{l.rent.toLocaleString()}/mo</span></p>
                        {isRejected && l.rejectionReason && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700 leading-normal">
                            <span className="font-bold">Rejection Reason:</span> {l.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      {onListingClick && (
                        <button
                          onClick={() => onListingClick(l)}
                          className="flex-1 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 active:scale-98 transition-transform"
                        >
                          👁️ View
                        </button>
                      )}
                      {onToggleListingStatus && (
                        <button
                          onClick={() => onToggleListingStatus(l.id, (l as any).status || 'active')}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 active:scale-98 transition-transform"
                        >
                          {isPaused ? '▶️ Publish' : '⏸ Pause'}
                        </button>
                      )}
                      {onEditListing && (
                        <button
                          onClick={() => onEditListing(l)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 active:scale-98 transition-transform"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {onDeleteListing && (
                        <button
                          onClick={() => handleDelete(l.id, l.title)}
                          disabled={deletingId === l.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 active:scale-98 transition-transform"
                        >
                          {deletingId === l.id ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!isEditMode && (
        <div className="px-4 mb-8">
          <p className="text-xs font-semibold mb-2" style={{ color: '#5a5550' }}>Settings</p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2ddd8' }}>
            {[
              { label: 'Account details' },
              { label: 'Privacy & safety' },
              { label: 'Help & support' },
              { label: 'Terms & Conditions', action: () => onScreenNav?.('terms') },
              { label: 'Privacy Policy', action: () => onScreenNav?.('privacy') },
              { label: 'Refund Policy', action: () => onScreenNav?.('refund') },
            ].map((item, i) => (
              <div
                key={item.label}
                onClick={item.action}
                className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-stone-50"
                style={i > 0 ? { borderTop: '1px solid #e2ddd8' } : {}}
              >
                <span className="text-sm" style={{ color: '#141414' }}>{item.label}</span>
                <span style={{ color: '#7a7570', fontSize: 18 }}>›</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e2ddd8' }}>
              <span className="text-sm" style={{ color: '#141414' }}>Push notifications</span>
              <button
                onClick={() => setNotifications(n => !n)}
                className="w-10 h-6 rounded-full transition-colors relative"
                style={{ background: notifications ? '#1a3d2b' : '#e2ddd8' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: notifications ? '1.25rem' : '0.125rem' }}
                />
              </button>
            </div>
          </div>
          {!user?.isAnonymous && (
            <button
              onClick={onSignOut}
              className="w-full mt-3 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#fff', border: '1px solid #e2ddd8', color: '#d4652a' }}
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfileScreen
