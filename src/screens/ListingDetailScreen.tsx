import React, { useState, useRef, useEffect } from 'react'
import { Listing } from '../types'
import { BackIcon, VerifiedIcon, LocationIcon, BedIcon, BathIcon, FloorIcon, ChatIcon } from '../components/Icons'
import { MapModal, RazorpayCheckoutModal } from '../components/Modals'

export function ListingDetailScreen({
  listing,
  onBack,
  onChat,
  isUnlocked,
  onUnlock,
  passVouchers,
  hasBrokerService,
  visited = false,
  brokeragePaid = false,
  onMarkVisited,
  onPayBrokerage,
  onGoToPass,
  onUseVoucher,
  onBookBroker,
  user,
  userProfile
}: {
  listing: Listing
  onBack: () => void
  onChat: () => void
  isUnlocked: boolean
  onUnlock: (id: string) => void
  passVouchers: number
  hasBrokerService: boolean
  visited?: boolean
  brokeragePaid?: boolean
  onMarkVisited?: (id: string) => void
  onPayBrokerage?: (id: string) => Promise<void>
  onGoToPass: () => void
  onUseVoucher: (id: string) => Promise<boolean | void>
  onBookBroker: () => Promise<void>
  user?: any
  userProfile?: any
}) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showVoucherConfirmModal, setShowVoucherConfirmModal] = useState(false)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [isDeductingVoucher, setIsDeductingVoucher] = useState(false)
  const [voucherToastMsg, setVoucherToastMsg] = useState('')
  const [visitedState, setVisitedState] = useState(visited)
  const [brokeragePaidState, setBrokeragePaidState] = useState(brokeragePaid)
  const mediaCount = listing.media?.length || 0

  useEffect(() => {
    setVisitedState(visited)
  }, [visited])

  useEffect(() => {
    setBrokeragePaidState(brokeragePaid)
  }, [brokeragePaid])

  useEffect(() => {
    if (mediaCount <= 1) return
    const timer = setInterval(() => {
      setGalleryIdx(i => {
        const next = (i + 1) % mediaCount
        if (galleryRef.current) {
          const width = galleryRef.current.clientWidth
          galleryRef.current.scrollTo({
            left: next * width,
            behavior: 'smooth'
          })
        }
        return next
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [mediaCount])

  const handleScroll = () => {
    if (galleryRef.current) {
      const scrollLeft = galleryRef.current.scrollLeft
      const width = galleryRef.current.clientWidth
      if (width > 0) {
        const idx = Math.round(scrollLeft / width)
        setGalleryIdx(idx)
      }
    }
  }

  const isOwner = Boolean(
    (userProfile?.name && listing.postedBy === userProfile.name) ||
    (user?.uid && listing.postedByUid && listing.postedByUid === user.uid)
  )

  const [unlockedState, setUnlockedState] = useState(false)
  const unlocked = isUnlocked || isOwner || unlockedState

  const handleViewListerDetails = () => {
    if (unlocked) return
    if (!passVouchers || passVouchers <= 0) {
      onGoToPass()
    } else {
      setShowVoucherConfirmModal(true)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {voucherToastMsg && (
        <div className="bg-emerald-800 text-white text-xs font-bold px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top z-30">
          <div className="flex items-center gap-2">
            <span>{voucherToastMsg}</span>
          </div>
          <button onClick={() => setVoucherToastMsg('')} className="text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Hero image */}
      <div className="relative" style={{ height: 260 }}>
        {listing.media && listing.media.length > 0 ? (
          <div 
            ref={galleryRef}
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory"
          >
            {listing.media.map((item: any, idx: number) => (
              <div key={idx} className="w-full h-full shrink-0 snap-start relative">
                {item.type === 'video' ? (
                  <video src={item.url} controls className="w-full h-full object-cover bg-black" />
                ) : (
                  <img src={item.url} alt={listing.title} className="w-full h-full object-cover bg-stone-200" />
                )}
                <span className="absolute top-12 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-black/60 z-10">
                  {idx + 1} / {listing.media.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover bg-stone-200"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%)' }}
        />
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(255,255,255,0.9)' }}
        >
          <BackIcon />
        </button>
        <div
          className="absolute bottom-4 left-4 text-white text-xs font-semibold px-2 py-1 rounded-full z-10"
          style={{ background: listing.available === 'Immediate' ? '#d4652a' : '#1a3d2b' }}
        >
          {listing.available}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>{listing.title}</h2>
            {listing.verified && (
              <span className="flex items-center gap-1 text-xs font-semibold shrink-0 mt-1" style={{ color: '#1a3d2b' }}>
                <VerifiedIcon /> Verified
              </span>
            )}
          </div>

          {/* Location details & Map option */}
          <div className="p-3.5 rounded-2xl mb-4" style={{ background: unlocked ? '#f0fdf4' : '#fdf0e8', border: unlocked ? '1px solid #bbf7d0' : '1px solid #fecdd3' }}>
            <div className="flex items-start gap-2 text-xs mb-1">
              <LocationIcon size={16} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-900">{listing.area}, {listing.town}</p>
                {unlocked ? (
                  <p className="text-xs text-stone-700 mt-0.5 font-medium">📍 {listing.street || 'Exact street address unlocked'}</p>
                ) : (
                  <div className="relative mt-1 cursor-pointer" onClick={handleViewListerDetails}>
                    <p className="text-xs text-stone-400 select-none blur-[5px] pointer-events-none">
                      Flat 4B, Sunrise Apartments, Main Street Road
                    </p>
                    <span className="absolute inset-0 flex items-center text-[11px] font-bold text-amber-900">
                      🔒 Exact street address hidden · Unlock with Token
                    </span>
                  </div>
                )}
              </div>
            </div>

            {unlocked ? (
              <button
                onClick={() => setShowMapModal(true)}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#1a3d2b] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                🗺️ View Exact Location on Map
              </button>
            ) : (
              <button
                onClick={handleViewListerDetails}
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 active:scale-98 transition-transform"
              >
                🔒 Map Location Locked · View Lister Details
              </button>
            )}
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl"
            style={{ background: '#f7f5f1' }}
          >
            {[
              { icon: <BedIcon />, val: `${listing.bedrooms} bed` },
              { icon: <BathIcon />, val: `${listing.bathrooms} bath` },
              { icon: <FloorIcon />, val: listing.floor === 'Ground' ? 'Ground floor' : `Floor ${listing.floor}` },
            ].map(({ icon, val }) => (
              <div key={val} className="flex flex-col items-center gap-1">
                <span style={{ color: '#7a7570' }}>{icon}</span>
                <span className="text-xs font-semibold" style={{ color: '#141414' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.tags.map(tag => (
              <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>{tag}</span>
            ))}
          </div>

          {/* Description */}
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#141414' }}>About this space</h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#5a5550' }}>{listing.description}</p>

          {/* Owner details card */}
          <div className="p-3.5 rounded-2xl mb-4 bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                👤 Property Lister Details
              </span>
              {unlocked ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ✨ Unlocked with Token
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>
            {unlocked ? (
              <div className="space-y-1.5 text-xs">
                <p className="text-stone-900 font-semibold">Name: <span className="font-normal text-stone-800">{listing.ownerName || listing.postedBy || 'Kabir Singh'}</span></p>
                <div className="text-stone-900 font-semibold flex items-center justify-between">
                  <span>Mobile: <span className="font-normal text-stone-800">{listing.ownerPhone || listing.postedByPhone || '+91 98765 43210'}</span></span>
                  <a href={`tel:${listing.ownerPhone || listing.postedByPhone || '+919876543210'}`} className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] shadow-sm">Call Lister</a>
                </div>
              </div>
            ) : (
              <div className="relative py-1 cursor-pointer" onClick={handleViewListerDetails}>
                <div className="space-y-1 text-xs blur-[5px] select-none pointer-events-none opacity-60">
                  <p className="text-stone-900 font-semibold">Name: Kabir Singh</p>
                  <p className="text-stone-900 font-semibold">Mobile: +91 98765 43210</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">🔒 Tap to view lister details with 1 Token</span>
                  <span className="text-[11px] font-bold text-emerald-800 underline">Unlock ›</span>
                </div>
              </div>
            )}
          </div>

          {/* Posted by card */}
          <div className="p-3.5 rounded-2xl mb-4 bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-3">
              {unlocked ? (
                <img src={listing.postedByAvatar} alt={listing.postedBy} className="w-10 h-10 rounded-full object-cover bg-stone-200 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0 text-stone-500 font-bold text-sm">
                  👤
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500">Listed by</p>
                <p className="text-sm font-bold text-stone-900 truncate">{listing.postedBy}</p>
                {unlocked ? (
                  <p className="text-xs text-stone-600 font-medium mt-0.5">📞 {listing.postedByPhone || listing.ownerPhone || '+91 99999 88888'}</p>
                ) : (
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5 select-none blur-[4px]">📞 +91 98765 43210</p>
                )}
              </div>
              <div className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-900 shrink-0">
                Active
              </div>
            </div>
          </div>

          {/* Post-Visit Brokerage Card (Shown to users who have used 1 token to view details) */}
          {unlocked && !isOwner && (
            <div className="p-3.5 rounded-2xl mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-xs">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                      Revenue Policy
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">Payable after visit</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mt-1">Post-Visit Flat Brokerage (₹2,000)</h4>
                </div>
                <span className="font-mono text-xs font-black text-amber-950 bg-amber-200 px-2.5 py-1 rounded-lg shrink-0">₹2,000</span>
              </div>

              {brokeragePaidState || brokeragePaid ? (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <span>✅</span>
                    <div>
                      <p className="leading-tight">₹2,000 Brokerage Paid via App</p>
                      <p className="text-[10px] text-emerald-700 font-normal">Receipt #BRK-{listing.id.slice(-6).toUpperCase()} · Confirmed</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md">Paid</span>
                </div>
              ) : visitedState || visited ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-xs flex items-center justify-between text-amber-950 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span>Flat visited · Brokerage due: ₹2,000</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">Due</span>
                  </div>
                  <button
                    onClick={() => setShowBrokerModal(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <span>💳 Pay ₹2,000 Brokerage via Razorpay</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setVisitedState(true)
                      onMarkVisited?.(listing.id)
                      setVoucherToastMsg('📍 Flat marked as visited! You can now pay the ₹2,000 brokerage via app.')
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold active:scale-98 transition-transform flex items-center justify-center gap-1"
                  >
                    <span>✅ Mark Visited</span>
                  </button>
                  <button
                    onClick={() => setShowBrokerModal(true)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-1"
                  >
                    <span>💳 Pay ₹2,000</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 pt-2" style={{ borderTop: '1px solid #e2ddd8', background: '#fff' }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-xs" style={{ color: '#7a7570' }}>Monthly rent</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>
              ₹{listing.rent.toLocaleString()}
            </p>
          </div>
          {isOwner ? (
            <span className="px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              🏠 Your Listing
            </span>
          ) : unlocked ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onChat}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-white active:scale-95 transition-transform"
                style={{ background: '#1a3d2b' }}
              >
                <ChatIcon active={false} />
                <span>Chat</span>
              </button>
              {!(brokeragePaidState || brokeragePaid) && (
                <button
                  onClick={() => setShowBrokerModal(true)}
                  className="flex items-center gap-1 px-3.5 py-3 rounded-xl text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 shadow-sm active:scale-95 transition-transform"
                >
                  <span>Pay ₹2k Brokerage</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleViewListerDetails}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-[#1a3d2b] shadow-lg shadow-[#1a3d2b]/20 active:scale-95 transition-transform"
            >
              {passVouchers > 0 ? (
                <span>👁️ View Lister (1 Token)</span>
              ) : (
                <span>🎫 View Lister · Buy Tokens</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Toast/Modal when user has a token and clicks View Lister Details */}
      {showVoucherConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3.5 text-2xl font-bold shadow-inner">
              🪙
            </div>
            <h3 className="text-base font-bold text-center text-stone-900 mb-2">
              Use 1 Token for this Flat?
            </h3>
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 mb-4 text-center">
              <p className="text-xs text-stone-700 leading-relaxed">
                You currently have <span className="font-bold text-emerald-800">{passVouchers} token{passVouchers > 1 ? 's' : ''}</span>. Using 1 token unlocks the lister's direct phone number, full address, and allows you to visit the flat.
              </p>
              <p className="text-[11px] text-stone-500 mt-2 font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
                🤝 Note: Under the new revenue system, a flat ₹2,000 brokerage is payable through the app after your visit.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setIsDeductingVoucher(true)
                  try {
                    await onUseVoucher(listing.id)
                    setShowVoucherConfirmModal(false)
                    setUnlockedState(true)
                    setVoucherToastMsg(`🎉 1 Token applied! You have ${passVouchers - 1} token${passVouchers - 1 === 1 ? '' : 's'} remaining.`)
                  } finally {
                    setIsDeductingVoucher(false)
                  }
                }}
                disabled={isDeductingVoucher}
                className="w-full py-3 rounded-xl bg-[#1a3d2b] text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isDeductingVoucher ? 'Unlocking Details...' : 'Yes, Use 1 Token'}
              </button>
              <button
                onClick={() => setShowVoucherConfirmModal(false)}
                disabled={isDeductingVoucher}
                className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 active:scale-98 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showMapModal && (
        <MapModal
          lat={listing.lat || 19.0760}
          lng={listing.lng || 72.8777}
          title={listing.title}
          street={listing.street || ''}
          area={listing.area}
          town={listing.town}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {showBrokerModal && (
        <RazorpayCheckoutModal
          title={`Post-Visit Brokerage: ${listing.title}`}
          subtitle="Flat Visit Brokerage · ₹2,000"
          amount={2000}
          benefits={[
            'Official ₹2,000 brokerage fee settlement for this property',
            'Full visit verification & landlord confirmation',
            'Direct rent agreement assistance & digital receipt',
            'Seamless move-in facilitation'
          ]}
          onSuccess={async () => {
            if (onPayBrokerage) {
              await onPayBrokerage(listing.id)
            } else {
              await onBookBroker()
            }
            setBrokeragePaidState(true)
            setVisitedState(true)
            setShowBrokerModal(false)
            setVoucherToastMsg('🎉 ₹2,000 Brokerage paid successfully! Receipt recorded in app.')
          }}
          onClose={() => setShowBrokerModal(false)}
        />
      )}
    </div>
  )
}

export default ListingDetailScreen
