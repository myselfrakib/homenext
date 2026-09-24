import React, { useState, useEffect } from 'react'
import { Listing } from '../types'
import { HeartIcon, LocationIcon, BedIcon, BathIcon, FloorIcon } from './Icons'

// ─── Featured Carousel Card ───────────────────────────────────────────────────

export function FeaturedCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const [saved, setSaved] = useState(false)
  const images = (listing.media && listing.media.filter((m: any) => m.type === 'image').map((m: any) => m.url)) || [listing.imageUrl]
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div
      onClick={onClick}
      className="relative shrink-0 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
      style={{ width: 260, height: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
    >
      <div 
        className="w-full h-full flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${imgIdx * 100}%)` }}
      >
        {images.map((url, idx) => (
          <img 
            key={idx} 
            src={url} 
            alt={listing.title} 
            className="w-full h-full object-cover shrink-0" 
          />
        ))}
      </div>
      {/* Gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, transparent 30%, rgba(10,20,14,0.85) 100%)' }} />

      {/* Top row */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <span
          className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: listing.available === 'Immediate' ? 'rgba(212,101,42,0.92)' : 'rgba(26,61,43,0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {listing.available}
        </span>
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Lister row */}
        <div className="flex items-center gap-2 mb-3">
          <img src={listing.postedByAvatar} alt={listing.postedBy} className="w-6 h-6 rounded-full object-cover border border-white/30 bg-stone-400" />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{listing.postedBy}</span>
          {listing.verified && (
            <span className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#86efac' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#86efac"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Verified
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold leading-tight mb-1" style={{ fontSize: 16 }}>{listing.title}</h3>
        <div className="flex items-center gap-1 mb-3" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
          <LocationIcon size={11} />
          <span>{listing.area}, {listing.town}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {[`${listing.bedrooms}bd`, `${listing.bathrooms}ba`, listing.floor === 'Ground' ? 'G floor' : `Floor ${listing.floor}`].map(s => (
            <span key={s} className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)' }}>{s}</span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            ₹{listing.rent.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>/mo</span>
        </div>
      </div>
    </div>
  )
}

// ─── Compact Listing Card ─────────────────────────────────────────────────────

export function CompactCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const [saved, setSaved] = useState(false)
  const images = (listing.media && listing.media.filter((m: any) => m.type === 'image').map((m: any) => m.url)) || [listing.imageUrl]
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div
      onClick={onClick}
      className="shrink-0 bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
      style={{ width: 185, boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="relative overflow-hidden" style={{ height: 130 }}>
        <div 
          className="w-full h-full flex transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${imgIdx * 100}%)` }}
        >
          {images.map((url, idx) => (
            <img 
              key={idx} 
              src={url} 
              alt={listing.title} 
              className="w-full h-full object-cover bg-stone-100 shrink-0" 
            />
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }} />
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
        >
          <HeartIcon filled={saved} />
        </button>
        <span
          className="absolute bottom-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: listing.available === 'Immediate' ? 'rgba(212,101,42,0.9)' : 'rgba(26,61,43,0.85)' }}
        >
          {listing.available}
        </span>
      </div>
      <div className="p-2.5">
        <p className="font-semibold text-xs leading-snug mb-0.5 truncate" style={{ color: '#141414' }}>{listing.title}</p>
        <div className="flex items-center gap-1 mb-1.5" style={{ color: '#7a7570' }}>
          <LocationIcon size={11} />
          <span className="text-xs truncate">{listing.area}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: '#1a3d2b' }}>
            ₹{listing.rent.toLocaleString()}
          </span>
          <span className="text-xs" style={{ color: '#7a7570' }}>/mo</span>
        </div>
      </div>
    </div>
  )
}

// ─── Full Listing Row Card ────────────────────────────────────────────────────

export function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const [saved, setSaved] = useState(false)
  const images = (listing.media && listing.media.filter((m: any) => m.type === 'image').map((m: any) => m.url)) || [listing.imageUrl]
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform flex"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Image */}
      <div className="relative shrink-0 overflow-hidden" style={{ width: 130, height: 130 }}>
        <div 
          className="w-full h-full flex transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${imgIdx * 100}%)` }}
        >
          {images.map((url, idx) => (
            <img 
              key={idx} 
              src={url} 
              alt={listing.title} 
              className="w-full h-full object-cover bg-stone-100 shrink-0" 
            />
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />
        <span
          className="absolute bottom-2 left-2 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: listing.available === 'Immediate' ? 'rgba(212,101,42,0.9)' : 'rgba(26,61,43,0.85)', fontSize: 10 }}
        >
          {listing.available}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-sm leading-tight" style={{ color: '#141414' }}>{listing.title}</h3>
            <button
              onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
              className="shrink-0 -mt-0.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#d4652a' : 'none'} stroke={saved ? '#d4652a' : '#c8c3be'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 mt-0.5" style={{ color: '#7a7570' }}>
            <LocationIcon size={11} />
            <span className="text-xs truncate">{listing.area}, {listing.town}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2.5 mb-2" style={{ color: '#7a7570' }}>
            <span className="flex items-center gap-1 text-xs"><BedIcon />{listing.bedrooms}</span>
            <span className="flex items-center gap-1 text-xs"><BathIcon />{listing.bathrooms}</span>
            <span className="flex items-center gap-1 text-xs"><FloorIcon />{listing.floor === 'Ground' ? 'G floor' : `Floor ${listing.floor}`}</span>
            {listing.verified && (
              <span className="ml-auto flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#1a3d2b' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#1a3d2b"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {listing.tags.slice(0, 2).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b', fontWeight: 500, fontSize: 10 }}>{t}</span>
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: '#1a3d2b', whiteSpace: 'nowrap' }}>
              ₹{(listing.rent / 1000).toFixed(0)}k<span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 400, color: '#7a7570' }}>/mo</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
