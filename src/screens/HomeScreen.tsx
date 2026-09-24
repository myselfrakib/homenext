import React, { useState } from 'react'
import { Listing } from '../types'
import { SearchIcon, FilterIcon, StarIcon } from '../components/Icons'
import { FeaturedCard, CompactCard, ListingCard } from '../components/Cards'

export function HomeScreen({ 
  listings, 
  onListingClick,
  passVouchers = 0,
  onGoToPass,
  myListingsCount = 0,
  onGoToProfile
}: { 
  listings: Listing[]; 
  onListingClick: (l: Listing) => void;
  passVouchers?: number;
  onGoToPass?: () => void;
  myListingsCount?: number;
  onGoToProfile?: () => void;
}) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Studio' | '1BHK' | '2BHK' | '3BHK+'>('All')

  const FEATURED_IMAGES = [
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&h=900&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?w=600&h=900&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1628592102751-ba83b0314276?w=600&h=900&fit=crop&auto=format',
  ]

  // Inject richer images into featured listings (or fallback first 3) for the carousel
  const featured = listings.filter(l => l.featured)
  const featuredListings = (featured.length > 0 ? featured : listings.slice(0, 3)).map((l, i) => ({
    ...l,
    imageUrl: FEATURED_IMAGES[i % FEATURED_IMAGES.length] ?? l.imageUrl,
  }))

  const categoryFilters: { label: 'All' | 'Studio' | '1BHK' | '2BHK' | '3BHK+'; icon: string }[] = [
    { label: 'All', icon: '🏠' },
    { label: 'Studio', icon: '🛋️' },
    { label: '1BHK', icon: '🛏' },
    { label: '2BHK', icon: '🏡' },
    { label: '3BHK+', icon: '🏘️' },
  ]

  const filteredListings = listings.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.town.toLowerCase().includes(q)
    const matchFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Studio' ? l.bedrooms === 1 && (l.sqft ? l.sqft < 600 : true) :
      activeFilter === '1BHK' ? l.bedrooms === 1 :
      activeFilter === '2BHK' ? l.bedrooms === 2 :
      l.bedrooms >= 3
    return matchSearch && matchFilter
  })

  const showFeatured = !search && activeFilter === 'All'

  return (
    <div className="flex flex-col h-full" style={{ background: '#f7f5f1' }}>
      {/* ── Sticky Header ── */}
      <div
        className="shrink-0 px-4 pt-12 pb-4"
        style={{
          background: 'linear-gradient(180deg, #f7f5f1 80%, transparent 100%)',
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9d9690' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search area, city, or type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none font-sans"
              style={{
                background: '#fff',
                border: '1px solid #e2ddd8',
                color: '#141414',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            />
          </div>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#fff', border: '1px solid #e2ddd8', color: '#5a5550', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <FilterIcon />
          </button>
          {onGoToPass && (
            <button
              onClick={onGoToPass}
              className="h-10 px-3 rounded-xl flex items-center gap-1.5 shrink-0 bg-emerald-900 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <span>🪙</span>
              <span>{passVouchers > 0 ? `${passVouchers} Tokens` : 'Premium'}</span>
            </button>
          )}

        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Stats strip ── */}
        <div className="flex items-center gap-4 px-4 mb-4">
          {[
            { val: listings.length.toString(), label: 'Spaces' },
            { val: '3', label: 'New today' },
            { val: '5', label: 'Cities' },
          ].map(({ val, label }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#1a3d2b' }}>{val}</span>
              <span className="text-xs" style={{ color: '#9d9690' }}>{label}</span>
            </div>
          ))}
          <div className="ml-auto flex -space-x-2">
            {listings.slice(0, 3).map(l => (
              <img key={l.id} src={l.postedByAvatar} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-white bg-stone-200" />
            ))}
            {listings.length > 3 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold" style={{ background: '#eaf2ec', color: '#1a3d2b', fontSize: 9 }}>+{listings.length - 3}</div>
            )}
          </div>
        </div>

        {/* ── My Listings Indicator (if user posted properties) ── */}
        {myListingsCount > 0 && onGoToProfile && (
          <div className="px-4 mb-5">
            <div
              onClick={onGoToProfile}
              className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                  🏠
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    Your Posted {myListingsCount === 1 ? 'Listing' : 'Listings'} ({myListingsCount})
                  </p>
                  <p className="text-[10px] text-stone-500 truncate">
                    Moved to your Profile page · Tap to view & manage
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                Profile ›
              </span>
            </div>
          </div>
        )}

        {/* ── Featured Carousel ── */}
        {showFeatured && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-sm font-bold" style={{ color: '#141414' }}>Featured spaces</h2>
              <button className="text-xs font-semibold" style={{ color: '#1a3d2b' }}>See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
              {featuredListings.map(l => (
                <FeaturedCard key={l.id} listing={l} onClick={() => onListingClick(l)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Category filter pills ── */}
        <div className="flex gap-2.5 overflow-x-auto px-4 mb-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {categoryFilters.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all"
              style={activeFilter === label
                ? { background: '#1a3d2b', color: '#fff', boxShadow: '0 3px 10px rgba(26,61,43,0.25)' }
                : { background: '#fff', color: '#5a5550', border: '1px solid #e2ddd8' }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ── New this week horizontal strip (shown when no filter active) ── */}
        {showFeatured && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-sm font-bold" style={{ color: '#141414' }}>New this week</h2>
              <div className="flex items-center gap-1">
                <StarIcon />
                <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Fresh picks</span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
              {[...listings].reverse().map(l => (
                <CompactCard key={l.id} listing={l} onClick={() => onListingClick(l)} />
              ))}
            </div>
          </div>
        )}

        {/* ── All listings ── */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: '#141414' }}>
              {search ? `Results for "${search}"` : activeFilter !== 'All' ? `${activeFilter} spaces` : 'All spaces'}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>
              {filteredListings.length} found
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {filteredListings.map(l => (
              <ListingCard key={l.id} listing={l} onClick={() => onListingClick(l)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
