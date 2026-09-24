import React, { useState } from 'react'
import { PassPlan, PASS_PLANS, Listing } from '../types'
import { BackIcon } from '../components/Icons'
import { RazorpayCheckoutModal } from '../components/Modals'

export function PassScreen({
  passVouchers,
  hasBrokerService = false,
  onBack,
  onBuyPass,
  onBookBroker,
  onViewListing,
  unlockedListings = {},
  visitedListings = {},
  brokeragePaidListings = {},
  listings = [],
  onMarkVisited,
  onPayBrokerage,
  onListingClick
}: {
  passVouchers: number
  hasBrokerService?: boolean
  onBack: () => void
  onBuyPass: (plan: PassPlan) => Promise<void>
  onBookBroker?: () => Promise<void>
  onViewListing?: () => void
  unlockedListings?: Record<string, boolean>
  visitedListings?: Record<string, boolean>
  brokeragePaidListings?: Record<string, { paid: boolean; paidAt?: string; txnId?: string }>
  listings?: Listing[]
  onMarkVisited?: (listingId: string) => void
  onPayBrokerage?: (listingId: string) => Promise<void>
  onListingClick?: (listing: Listing) => void
}) {
  const [selectedPlan, setSelectedPlan] = useState<PassPlan>(PASS_PLANS[1]) // Default to 599
  const [checkoutData, setCheckoutData] = useState<{
    open: boolean
    title: string
    subtitle: string
    amount: number
    benefits?: string[]
    onSuccess: () => Promise<void>
  } | null>(null)
  const [passToast, setPassToast] = useState('')

  const unlockedFlats = listings.filter(l => unlockedListings[l.id])

  const handlePayPlan = (plan: PassPlan) => {
    setSelectedPlan(plan)
    setCheckoutData({
      open: true,
      title: `${plan.name} (${plan.tokens || plan.views} Tokens)`,
      subtitle: `Nestly ${plan.tokens || plan.views} Flat Unlock Tokens`,
      amount: plan.price,
      benefits: [
        `Unlock ${plan.tokens || plan.views} complete flat lister details`,
        'Direct owner/lister mobile number & call access',
        'Exact street address & interactive map navigation',
        'Direct chat with property posters',
        'Permission to arrange & visit the flat',
        'Standard ₹2,000 brokerage payable in-app after visit'
      ],
      onSuccess: async () => {
        await onBuyPass(plan)
        setCheckoutData(null)
        setPassToast(`🎉 Success! ${plan.tokens || plan.views} flat tokens added to your wallet.`)
        setTimeout(() => setPassToast(''), 4500)
      }
    })
  }

  const handlePayBrokerageForListing = (listingId?: string, listingTitle?: string) => {
    setCheckoutData({
      open: true,
      title: listingTitle ? `Brokerage: ${listingTitle}` : 'Post-Visit Flat Brokerage',
      subtitle: 'Flat Visit Brokerage Fee · ₹2,000',
      amount: 2000,
      benefits: [
        'Official ₹2,000 flat brokerage settlement',
        'Full physical visit verification & record',
        'Assistance with rent negotiation & legal agreement',
        'Instant digital payment receipt & move-in clearance'
      ],
      onSuccess: async () => {
        if (listingId && onPayBrokerage) {
          await onPayBrokerage(listingId)
        } else if (onBookBroker) {
          await onBookBroker()
        }
        setCheckoutData(null)
        setPassToast('🎉 ₹2,000 Brokerage paid successfully! Receipt generated.')
        setTimeout(() => setPassToast(''), 4500)
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f5f1] relative">
      {/* Toast Notification */}
      {passToast && (
        <div className="bg-emerald-800 text-white text-xs font-bold px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top z-30">
          <span>{passToast}</span>
          <button onClick={() => setPassToast('')} className="text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Sticky Top Bar */}
      <div className="shrink-0 px-4 pt-12 pb-3 bg-white border-b border-[#e2ddd8] flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 active:scale-95 transition-transform"
          >
            <BackIcon />
          </button>
          <div>
            <h1 className="text-base font-bold text-stone-900 leading-none">Premium Payment</h1>
            <p className="text-[11px] text-stone-500 mt-0.5 font-medium">Flat Tokens & Post-Visit Brokerage</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <span>🪙</span>
          <span>{passVouchers} {passVouchers === 1 ? 'Token' : 'Tokens'}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Token Balance Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1a3d2b] to-[#11291d] text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-[-15px] bottom-[-20px] text-7xl opacity-10 pointer-events-none font-bold">
            🪙
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full">
                Your Token Wallet
              </span>
              <h2 className="text-3xl font-bold mt-1.5 flex items-baseline gap-2">
                <span>{passVouchers}</span>
                <span className="text-xs font-normal text-emerald-200">flat tokens available</span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-[260px] leading-relaxed">
                {passVouchers > 0
                  ? 'Each token reveals 1 flat lister phone number & address to contact and visit.'
                  : 'You have 0 tokens. Choose a plan below to reveal lister phone numbers and visit flats.'}
              </p>
            </div>
          </div>
          {passVouchers > 0 && onViewListing && (
            <button
              onClick={onViewListing}
              className="mt-3.5 w-full py-2.5 rounded-xl bg-white text-[#1a3d2b] text-xs font-bold shadow-sm active:scale-98 transition-transform"
            >
              Continue to Flat Details →
            </button>
          )}
        </div>

        {/* ── Explainer: The New Revenue System ── */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              New Revenue Model
            </span>
            <span className="text-xs font-bold text-stone-900">How It Works</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-xl mb-1">🪙</div>
              <p className="text-[11px] font-bold text-stone-900">1. Buy Tokens</p>
              <p className="text-[10px] text-stone-500 mt-0.5">₹499 (6), ₹599 (7), or ₹699 (10)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="text-xl mb-1">📞</div>
              <p className="text-[11px] font-bold text-stone-900">2. View & Visit</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Get lister phone, contact & visit flat</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
              <div className="text-xl mb-1">🤝</div>
              <p className="text-[11px] font-bold text-amber-950">3. ₹2,000 Fee</p>
              <p className="text-[10px] text-amber-800 mt-0.5">Pay brokerage via app after visiting</p>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div>
          <h3 className="text-sm font-bold text-stone-900">Choose Your Token Plan</h3>
          <p className="text-[11px] text-stone-500 font-medium">Select how many flat unlock tokens you want to get started</p>
        </div>

        {/* 3 Token Plans: 499 (6 tokens), 599 (7 tokens), 699 (10 tokens) */}
        <div className="space-y-3">
          {PASS_PLANS.map(plan => {
            const isSelected = selectedPlan.id === plan.id
            const isPopular = plan.popular
            const tokenCount = plan.tokens || plan.views
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative bg-white ${
                  isPopular 
                    ? 'border-emerald-700 shadow-md ring-2 ring-emerald-700/10' 
                    : isSelected 
                    ? 'border-stone-800 shadow-sm' 
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {plan.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isPopular 
                      ? 'bg-amber-400 text-stone-950 shadow-xs' 
                      : 'bg-stone-100 text-stone-700'
                  }`}>
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-start justify-between pr-20 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{plan.name}</h4>
                    <p className="text-xs text-emerald-800 font-bold mt-0.5">
                      🪙 {tokenCount} Flat Unlock Tokens
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-mono text-2xl font-black text-stone-900">₹{plan.price}</span>
                  <span className="text-xs text-stone-500 font-medium">
                    (₹{plan.pricePerView} per flat token)
                  </span>
                </div>

                <div className="space-y-1.5 mb-3.5 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Unlock {tokenCount} flat lister phone numbers & names</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Direct call, WhatsApp & in-app chat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Exact street address & map navigation to visit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span className="text-stone-700 font-medium">₹2,000 standard flat brokerage payable post-visit via app</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePayPlan(plan)
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-1.5 ${
                    isPopular 
                      ? 'bg-[#1a3d2b] text-white hover:bg-emerald-900' 
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  <span>Pay ₹{plan.price} for {tokenCount} Tokens</span>
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Post-Visit Brokerage Payment Section (₹2,000) ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/70 border-2 border-amber-300 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                Post-Visit Brokerage
              </span>
              <h4 className="text-sm font-bold text-stone-900 mt-1">Pay Flat Brokerage (₹2,000)</h4>
              <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                Payable directly through the app after your property visit
              </p>
            </div>
            <span className="font-mono text-xl font-black text-amber-950 bg-amber-200/90 px-3 py-1 rounded-xl shrink-0">
              ₹2,000
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed mb-3">
            Have you completed a physical flat visit? Under our revenue policy, a flat ₹2,000 brokerage is charged per visited property. You can pay securely through Razorpay right here in the app.
          </p>

          {/* List of Unlocked Flats and their Visit / Brokerage Payment Status */}
          {unlockedFlats.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-bold text-stone-800">Your Unlocked Properties:</p>
              {unlockedFlats.map(flat => {
                const isPaid = brokeragePaidListings[flat.id]?.paid
                const isVisited = visitedListings[flat.id]
                return (
                  <div key={flat.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-900 truncate">{flat.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">{flat.area}, {flat.town}</p>
                    </div>
                    {isPaid ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md shrink-0">
                        Paid ₹2,000 ✅
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isVisited && (
                          <button
                            onClick={() => {
                              onMarkVisited?.(flat.id)
                              setPassToast(`📍 Marked "${flat.title}" as visited!`)
                            }}
                            className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[10px] font-bold border border-stone-300 active:scale-95"
                          >
                            Mark Visited
                          </button>
                        )}
                        <button
                          onClick={() => handlePayBrokerageForListing(flat.id, flat.title)}
                          className="px-2.5 py-1 rounded-lg bg-amber-700 text-white text-[10px] font-bold shadow-xs active:scale-95"
                        >
                          Pay ₹2k
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => handlePayBrokerageForListing()}
            className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5"
          >
            <span>💳 Pay ₹2,000 Post-Visit Brokerage via App</span>
          </button>
        </div>

        {/* Why Nestly Revenue System */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Why Nestly's Revenue System?
          </h4>
          <div className="space-y-2 text-xs text-stone-600">
            <p>• <b>Direct Lister Phone:</b> 1 token reveals complete phone number and owner details without middleman markup.</p>
            <p>• <b>Visit First, Pay Later:</b> Pay the ₹2,000 flat brokerage only after you visit the flat.</p>
            <p>• <b>App Convenience:</b> Integrated Razorpay gateway provides instant verification and receipts.</p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckoutModal
          title={checkoutData.title}
          subtitle={checkoutData.subtitle}
          amount={checkoutData.amount}
          benefits={checkoutData.benefits}
          onSuccess={checkoutData.onSuccess}
          onClose={() => setCheckoutData(null)}
        />
      )}
    </div>
  )
}

export default PassScreen
