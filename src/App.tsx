import { useState, useRef, useEffect } from 'react'
import { auth, firestore, storage } from './firebase'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const getOrCreateGuestUser = () => {
  let guest = sessionStorage.getItem('nestly_guest_user')
  if (guest) {
    try {
      return JSON.parse(guest)
    } catch (e) {}
  }
  const newGuest = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 11),
    isAnonymous: true,
    displayName: 'Guest User',
    photoURL: '',
    email: ''
  }
  sessionStorage.setItem('nestly_guest_user', JSON.stringify(newGuest))
  return newGuest
}


// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'home' | 'explore' | 'create' | 'chat' | 'chat-detail' | 'profile' | 'listing-detail' | 'auth' | 'admin-auth' | 'admin-dashboard'

interface Listing {
  id: string
  title: string
  area: string
  town: string
  rent: number
  bedrooms: number
  bathrooms: number
  floor: string
  tags: string[]
  imageUrl: string
  available: string
  postedBy: string
  postedByAvatar: string
  verified: boolean
  description: string
  lat?: number
  lng?: number
  postedByUid?: string
  postedByPhone?: string
  ownerName?: string
  ownerPhone?: string
  street?: string
  media?: any[]
  status?: string
  featured?: boolean
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMsg: string
  time: string
  unread: number
  listing: string
}

interface Message {
  id: string
  text: string
  sent: boolean
  time: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const LISTINGS: Listing[] = [
  {
    id: '1',
    title: '2BHK Modern Flat',
    area: 'Andheri West',
    town: 'Mumbai',
    rent: 32000,
    bedrooms: 2,
    bathrooms: 2,
    floor: '3',
    tags: ['Furnished', 'Pet Friendly', 'Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop&auto=format',
    available: 'From Aug 1',
    postedBy: 'Riya Sharma',
    postedByAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format',
    verified: true,
    description: 'A bright, well-maintained 2BHK in the heart of Andheri West. Recently renovated kitchen, two full bathrooms, dedicated parking spot in the basement. Great connectivity — just 7 minutes from Andheri Metro.',
    ownerName: 'Riya Sharma',
    ownerPhone: '+91 98765 43210',
    street: 'Flat 4B, Sunrise Apartments, MG Road',
    postedByPhone: '+91 98989 76767'
  },
  {
    id: '2',
    title: 'Studio near Tech Park',
    area: 'Whitefield',
    town: 'Bengaluru',
    rent: 18500,
    bedrooms: 1,
    bathrooms: 1,
    floor: 'Ground',
    tags: ['Semi-Furnished', 'WiFi Ready', 'Power Backup'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&auto=format',
    available: 'Immediate',
    postedBy: 'Arjun Nair',
    postedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    verified: true,
    description: 'Compact studio designed for working professionals. Located 2km from ITPL — ideal for anyone at Wipro or TCS campuses. Building has 24/7 security and a rooftop terrace.',
    ownerName: 'Arjun Nair',
    ownerPhone: '+91 98765 43211',
    street: 'Room 201, Green Meadows, Whitefield',
    postedByPhone: '+91 98989 76768'
  },
  {
    id: '3',
    title: 'Spacious 3BHK with Terrace',
    area: 'Banjara Hills',
    town: 'Hyderabad',
    rent: 45000,
    bedrooms: 3,
    bathrooms: 3,
    floor: '1',
    tags: ['Fully Furnished', 'Terrace', 'Gated'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    available: 'From Sep 15',
    postedBy: 'Priya Menon',
    postedByAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    verified: false,
    description: 'Generously sized 3BHK in a premium gated society. Private terrace with city views. Walking distance to Banjara Hills Road No. 12 restaurants and shopping.',
    ownerName: 'Priya Menon',
    ownerPhone: '+91 98765 43212',
    street: 'Villa 12, Palm Grove, Banjara Hills',
    postedByPhone: '+91 98989 76769'
  },
  {
    id: '4',
    title: '1BHK Cozy Apartment',
    area: 'Karol Bagh',
    town: 'New Delhi',
    rent: 22000,
    bedrooms: 1,
    bathrooms: 1,
    floor: '2',
    tags: ['Furnished', 'Metro Nearby'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format',
    available: 'From Aug 10',
    postedBy: 'Kabir Singh',
    postedByAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format',
    verified: true,
    description: 'Warm and quiet 1BHK two floors up in a well-maintained building. Karol Bagh Metro is a 4-minute walk. Ground-floor grocery and medical shop in the same lane.',
    ownerName: 'Kabir Singh',
    ownerPhone: '+91 98765 43213',
    street: 'Flat 1A, Shanti Nivas, Karol Bagh',
    postedByPhone: '+91 98989 76770'
  },
  {
    id: '5',
    title: 'Heritage Loft, Ground Floor',
    area: 'Fort',
    town: 'Mumbai',
    rent: 55000,
    bedrooms: 2,
    bathrooms: 1,
    floor: 'Ground',
    tags: ['Heritage', 'Unfurnished', 'High Ceiling'],
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop&auto=format',
    available: 'Immediate',
    postedBy: 'Zara Irani',
    postedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format',
    verified: true,
    description: 'Rare ground-floor loft in a pre-independence building in Fort. Original wooden floors, 14ft ceilings, and south-facing windows. Perfect for a creative studio or family.',
    ownerName: 'Zara Irani',
    ownerPhone: '+91 98765 43214',
    street: 'Flat 302, Sea View Apartments, Fort',
    postedByPhone: '+91 98989 76771'
  },
]

const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    name: 'Riya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format',
    lastMsg: 'Can I schedule a visit this Saturday?',
    time: '2m ago',
    unread: 2,
    listing: '2BHK Modern Flat · Mumbai',
  },
  {
    id: 'c2',
    name: 'Arjun Nair',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    lastMsg: 'Is the parking included in rent?',
    time: '1h ago',
    unread: 0,
    listing: 'Studio near Tech Park · Bengaluru',
  },
  {
    id: 'c3',
    name: 'Priya Menon',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    lastMsg: 'Sounds good, I will confirm by evening.',
    time: 'Yesterday',
    unread: 0,
    listing: '3BHK with Terrace · Hyderabad',
  },
]

const MESSAGES: Message[] = [
  { id: 'm1', text: 'Hi! I saw your listing for the 2BHK in Andheri West.', sent: false, time: '10:12 AM' },
  { id: 'm2', text: 'Hello! Yes, it\'s still available. Are you looking to move in soon?', sent: true, time: '10:14 AM' },
  { id: 'm3', text: 'Ideally from 1st August. Can I schedule a visit this Saturday?', sent: false, time: '10:15 AM' },
  { id: 'm4', text: 'Saturday works great! I\'m free between 11 AM and 2 PM.', sent: true, time: '10:18 AM' },
  { id: 'm5', text: 'Perfect. Is the parking spot covered?', sent: false, time: '10:20 AM' },
  { id: 'm6', text: 'Yes, basement covered parking — one spot included in the rent.', sent: true, time: '10:21 AM' },
  { id: 'm7', text: 'Can I schedule a visit this Saturday?', sent: false, time: '10:22 AM' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#1a3d2b' : 'none'} stroke={active ? '#1a3d2b' : '#7a7570'} strokeWidth="1.8">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
)

const ExploreIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a3d2b' : '#7a7570'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? 'rgba(26,61,43,0.15)' : 'none'} />
  </svg>
)

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ChatIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a3d2b' : '#7a7570'} strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a3d2b' : '#7a7570'} strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const LocationIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const BedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4v16M2 8h20v12H2M2 8c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4" />
  </svg>
)

const BathIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h16v2a6 6 0 01-6 6H10a6 6 0 01-6-6v-2z" />
    <path d="M4 12V6a2 2 0 012-2h1a2 2 0 012 2v1" />
  </svg>
)

const FloorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const SqftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M3 9h18" />
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const VerifiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#1a3d2b">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
  </svg>
)

const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a7570" strokeWidth="1.8">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Extra icons for home ─────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#d4652a' : 'none'} stroke={filled ? '#d4652a' : 'rgba(255,255,255,0.85)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
)

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
)

const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// ─── Featured Carousel Card ───────────────────────────────────────────────────

function FeaturedCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
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

function CompactCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
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

function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
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

// ─── Screens ──────────────────────────────────────────────────────────────────

function HomeScreen({ listings, onListingClick }: { listings: Listing[]; onListingClick: (l: Listing) => void }) {
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
      activeFilter === 'Studio' ? l.bedrooms === 1 && l.sqft < 600 :
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
          <div
            className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 shrink-0"
            style={{ border: '2px solid #1a3d2b' }}
          >
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format" alt="You" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Stats strip ── */}
        <div className="flex items-center gap-4 px-4 mb-5">
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

function MapModal({ 
  lat, 
  lng, 
  title, 
  street, 
  area, 
  town, 
  onClose 
}: { 
  lat: number; 
  lng: number; 
  title: string; 
  street: string; 
  area: string; 
  town: string; 
  onClose: () => void 
}) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if ((window as any).L) {
      const L = (window as any).L
      const map = L.map(mapRef.current).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)
      L.marker([lat, lng]).addTo(map).bindPopup(`<b>${title}</b><br/>${street || area}`).openPopup()
      return () => map.remove()
    }
  }, [lat, lng, title, street, area])

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="font-bold text-sm text-stone-900">Exact Property Location</h3>
            <p className="text-xs text-stone-500 truncate">{street || area}, {town}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 font-bold text-sm">×</button>
        </div>
        <div ref={mapRef} className="w-full h-64 bg-stone-100" />
        <div className="p-4 flex flex-col gap-2 bg-stone-50 border-t border-stone-200">
          <p className="text-xs text-stone-600 font-medium"><strong>Exact Address:</strong> {street || 'Address provided'}, {area}, {town}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 rounded-xl bg-[#1a3d2b] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <LocationIcon size={14} /> Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}

function RazorpayCheckoutModal({
  listing,
  feeAmount,
  onSuccess,
  onClose
}: {
  listing: Listing
  feeAmount: number
  onSuccess: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handlePay = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onSuccess()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="bg-[#0c2340] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">R</div>
            <div>
              <p className="font-bold text-sm leading-none">Razorpay Secure</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Nestly Property Access Fee</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white font-bold text-lg">×</button>
        </div>

        <div className="p-5">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500 font-medium">5% Rent Security Deposit</p>
              <p className="text-sm font-bold text-stone-900 truncate max-w-[200px]">{listing.title}</p>
            </div>
            <p className="font-mono text-lg font-bold text-[#1a3d2b]">₹{feeAmount.toLocaleString()}</p>
          </div>

          <div className="space-y-2 mb-5">
            <p className="text-xs font-semibold text-stone-700">What you get after payment:</p>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-emerald-600 font-bold">✓</span> Full Owner Name & Direct Mobile Number
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-emerald-600 font-bold">✓</span> Poster Contact Details
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-emerald-600 font-bold">✓</span> Exact Street Address & Interactive Map
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-emerald-600 font-bold">✓</span> Direct Chat with Lister
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#0c2340] text-white font-bold text-sm shadow-lg hover:bg-blue-950 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Razorpay...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{feeAmount.toLocaleString()} via Razorpay</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-center text-stone-400 mt-3 flex items-center justify-center gap-1">
            🔒 256-bit Encrypted · Simulated Razorpay Gateway
          </p>
        </div>
      </div>
    </div>
  )
}

function ListingDetailScreen({
  listing,
  onBack,
  onChat,
  isUnlocked,
  onUnlock,
  user,
  userProfile
}: {
  listing: Listing
  onBack: () => void
  onChat: () => void
  isUnlocked: boolean
  onUnlock: (id: string) => void
  user?: any
  userProfile?: any
}) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const mediaCount = listing.media?.length || 0

  const unlockFee = Math.round(listing.rent * 0.05)

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

  const handleTriggerPay = () => {
    setShowRazorpay(true)
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {unlockedState && (
        <div className="bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shadow-md animate-in slide-in-from-top z-20">
          <span>🎉 Payment Successful! All owner details & exact map location unlocked.</span>
          <button onClick={() => setUnlockedState(false)} className="text-white font-bold ml-2 text-sm">✕</button>
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
                  <div className="relative mt-1">
                    <p className="text-xs text-stone-400 select-none blur-[5px] pointer-events-none">
                      Flat 4B, Sunrise Apartments, Main Street Road
                    </p>
                    <span className="absolute inset-0 flex items-center text-[11px] font-bold text-rose-700">
                      🔒 Exact street address hidden · Pay 5% to unlock
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
                onClick={handleTriggerPay}
                className="mt-2 w-full py-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-200 active:scale-98 transition-transform"
              >
                🔒 Map Location Locked · Tap to Pay ₹{unlockFee.toLocaleString()}
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
                👤 Property Owner Details
              </span>
              {!unlocked && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>
            {unlocked ? (
              <div className="space-y-1.5 text-xs">
                <p className="text-stone-900 font-semibold">Name: <span className="font-normal text-stone-800">{listing.ownerName || 'Kabir Singh'}</span></p>
                <div className="text-stone-900 font-semibold flex items-center justify-between">
                  <span>Mobile: <span className="font-normal text-stone-800">{listing.ownerPhone || '+91 98765 43210'}</span></span>
                  <a href={`tel:${listing.ownerPhone || '+919876543210'}`} className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] shadow-sm">Call Owner</a>
                </div>
              </div>
            ) : (
              <div className="relative py-1">
                <div className="space-y-1 text-xs blur-[5px] select-none pointer-events-none opacity-60">
                  <p className="text-stone-900 font-semibold">Name: Kabir Singh</p>
                  <p className="text-stone-900 font-semibold">Mobile: +91 98765 43210</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">🔒 Pay 5% to reveal owner name & phone</span>
                </div>
              </div>
            )}
          </div>

          {/* Posted by card */}
          <div className="p-3.5 rounded-2xl mb-6 bg-stone-50 border border-stone-200">
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
                  <p className="text-xs text-stone-600 font-medium mt-0.5">📞 {listing.postedByPhone || '+91 99999 88888'}</p>
                ) : (
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5 select-none blur-[4px]">📞 +91 98765 43210</p>
                )}
              </div>
              <div className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-900 shrink-0">
                Active
              </div>
            </div>
          </div>
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
            <button
              onClick={onChat}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ background: '#1a3d2b' }}
            >
              <ChatIcon active={false} />
              Chat with lister
            </button>
          ) : (
            <button
              onClick={handleTriggerPay}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-[#1a3d2b] shadow-lg shadow-[#1a3d2b]/20 active:scale-95 transition-transform"
            >
              <span>💳 Pay to unlock (₹{unlockFee.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>

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

      {showRazorpay && (
        <RazorpayCheckoutModal
          listing={listing}
          feeAmount={unlockFee}
          onSuccess={() => {
            setShowRazorpay(false)
            setUnlockedState(true)
            onUnlock(listing.id)
          }}
          onClose={() => setShowRazorpay(false)}
        />
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a5550' }}>{label}</label>
      {children}
    </div>
  )
}

function CreateScreen({ onClose, onPublish, userProfile }: { onClose: () => void; onPublish: (data: any) => Promise<void>; userProfile?: any }) {
  const [step, setStep] = useState(1)
  const [publishing, setPublishing] = useState(false)
  const [form, setForm] = useState({
    title: '',
    street: '',
    town: '',
    district: '',
    state: '',
    pin: '',
    rent: '',
    deposit: '',
    bedrooms: '1',
    bathrooms: '1',
    floor: 'Ground',
    description: '',
    furnished: 'Unfurnished',
    available: '',
    tags: [] as string[],
    lat: null as number | null,
    lng: null as number | null,
    ownerName: '',
    ownerPhone: '+91 ',
  })

  const [fetchingLocation, setFetchingLocation] = useState(false)

  const handleAutofillAddress = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
          const data = await res.json()
          if (data && data.address) {
            const addr = data.address
            const postcode = addr.postcode || ''
            const locality = addr.suburb || addr.neighbourhood || addr.village || addr.locality || ''
            const districtVal = addr.city_district || addr.district || addr.county || addr.city || ''
            const stateVal = addr.state || ''
            
            setForm(f => ({
              ...f,
              lat,
              lng: lon,
              pin: postcode,
              town: locality,
              district: districtVal,
              state: stateVal
            }))
          } else {
            alert("Could not fetch location details.")
          }
        } catch (err) {
          console.error("Reverse geocoding error", err)
          alert("Error fetching address details.")
        } finally {
          setFetchingLocation(false)
        }
      },
      (err) => {
        console.error("Geolocation error", err)
        alert("Failed to get your location. Please check your location permissions.")
        setFetchingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video' }[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingMedia(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const storagePath = `listings/${Date.now()}_${file.name}`
        const fileRef = sRef(storage, storagePath)
        await uploadBytes(fileRef, file)
        const downloadUrl = await getDownloadURL(fileRef)
        const type = file.type.startsWith('video/') ? 'video' : 'image'
        setMediaFiles(prev => [...prev, { url: downloadUrl, type }])
      }
    } catch (err) {
      console.error(err)
      alert("Error uploading media files. Please try again.")
    } finally {
      setUploadingMedia(false)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
    }
  }

  const tagOptions = ['Parking', 'Pet Friendly', 'Couple Friendly', 'WiFi Ready', 'Power Backup', 'Gated', 'CCTV', 'Water 24/7', 'Gym', 'Lift']

  const toggleTag = (t: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
    }))
  }

  const isStepValid = () => {
    if (step === 1) {
      return form.title.trim().length > 0 && 
             form.rent.trim().length > 0 && 
             form.ownerName.trim().length > 0 && 
             form.ownerPhone.trim().length > 5
    }
    if (step === 2) {
      return form.town.trim().length > 0 && 
             form.district.trim().length > 0 && 
             form.pin.trim().length > 0 && 
             form.available.trim().length > 0
    }
    return true
  }

  const F = FormField

  const inp = "w-full px-3 py-2.5 rounded-xl text-sm outline-none"
  const inpStyle = { background: '#fff', border: '1px solid #e2ddd8', color: '#141414' }

  return (
    <div className="flex flex-col h-full" style={{ background: '#f7f5f1' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>
            {step === 1 ? 'List your space' : step === 2 ? 'Location & Details' : 'Photos & Amenities'}
          </h2>
          <p className="text-xs" style={{ color: '#7a7570' }}>Step {step} of 3</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#e2ddd8', color: '#5a5550' }}>
          <XIcon />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#e2ddd8' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%`, background: '#1a3d2b' }} />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === 1 && (
          <>
            <F label="Listing title">
              <input className={inp} style={inpStyle} placeholder="e.g. Sunny 2BHK near metro" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </F>
            <F label="Monthly rent (₹)">
              <input className={inp} style={inpStyle} type="number" placeholder="e.g. 25000" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))} />
            </F>
            <F label="Security deposit (₹)">
              <input className={inp} style={inpStyle} type="number" placeholder="e.g. 75000" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
            </F>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <F label="Owner's Name">
                <input className={inp} style={inpStyle} placeholder="Owner name" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
              </F>
              <F label="Owner's Mobile">
                <input className={inp} style={inpStyle} placeholder="+91 " value={form.ownerPhone} onChange={e => {
                  const val = e.target.value
                  if (val.startsWith('+91 ')) {
                    setForm(f => ({ ...f, ownerPhone: val }))
                  } else if (val.length < 4) {
                    setForm(f => ({ ...f, ownerPhone: '+91 ' }))
                  }
                }} />
              </F>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <F label="Bedrooms">
                <select className={inp} style={inpStyle} value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}>
                  {['1','2','3','4','5+'].map(v => <option key={v}>{v}</option>)}
                </select>
              </F>
              <F label="Bathrooms">
                <select className={inp} style={inpStyle} value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}>
                  {['1','2','3','4'].map(v => <option key={v}>{v}</option>)}
                </select>
              </F>
              <F label="Floor">
                <select className={inp} style={inpStyle} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}>
                  {['Ground', '1', '2', '3', '4', '5', '6', '7', '8', '9+'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </F>
            </div>
            <F label="Furnishing">
              <div className="flex gap-2">
                {['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].map(v => (
                  <button
                    key={v}
                    onClick={() => setForm(f => ({ ...f, furnished: v }))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={form.furnished === v ? { background: '#1a3d2b', color: '#fff' } : { background: '#fff', color: '#7a7570', border: '1px solid #e2ddd8' }}
                  >
                    {v.replace('-', '-\n')}
                  </button>
                ))}
              </div>
            </F>
          </>
        )}

        {step === 2 && (
          <>
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4 text-xs"
              style={{ background: '#fdf0e8', color: '#d4652a' }}
            >
              <LocationIcon size={13} />
              <span>Your exact address is kept private. Searchers will only see your town and area.</span>
            </div>

            <button
              type="button"
              onClick={handleAutofillAddress}
              disabled={fetchingLocation}
              className="w-full py-2.5 mb-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              style={{ 
                background: '#eaf2ec', 
                color: '#1a3d2b', 
                border: '1.5px solid #1a3d2b' 
              }}
            >
              {fetchingLocation ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1a3d2b]/30 border-t-[#1a3d2b] rounded-full animate-spin"></div>
                  <span>Fetching address details...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">📍</span>
                  <span>Auto-detect address & PIN</span>
                </>
              )}
            </button>
            <F label="Street / flat number (private)">
              <input className={inp} style={inpStyle} placeholder="Flat 4B, Sunrise Apartments, MG Road" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
            </F>
            <F label="Town / locality (shown publicly)">
              <input className={inp} style={inpStyle} placeholder="e.g. Andheri West" value={form.town} onChange={e => setForm(f => ({ ...f, town: e.target.value }))} />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="District">
                <input className={inp} style={inpStyle} placeholder="e.g. Mumbai Suburban" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
              </F>
              <F label="State">
                <input className={inp} style={inpStyle} placeholder="e.g. Maharashtra" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </F>
            </div>
            <F label="PIN code (private)">
              <input className={inp} style={inpStyle} placeholder="400053" maxLength={6} value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} />
            </F>
            <F label="Available from">
              <input className={inp} style={inpStyle} type="date" value={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.value }))} />
            </F>
            <F label="Description">
              <textarea
                className={inp}
                style={{ ...inpStyle, resize: 'none', minHeight: 90 }}
                placeholder="Describe the space, nearby landmarks, transport links..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </F>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              ref={mediaInputRef}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => mediaInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl mb-4 gap-2 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: '#fff', border: '2px dashed #e2ddd8', minHeight: 160 }}
            >
              {uploadingMedia ? (
                <>
                  <div className="w-8 h-8 border-4 border-[#1a3d2b]/30 border-t-[#1a3d2b] rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#5a5550' }}>Uploading media files...</p>
                </>
              ) : (
                <>
                  <CameraIcon />
                  <p className="text-sm font-semibold" style={{ color: '#5a5550' }}>Upload photos & videos</p>
                  <p className="text-xs" style={{ color: '#7a7570' }}>Tap to choose from gallery · up to 20 files</p>
                </>
              )}
            </div>

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {mediaFiles.map((m, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                    {m.type === 'image' ? (
                      <img src={m.url} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span style={{ fontSize: 9 }} className="mt-1 font-semibold">Video</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs font-semibold mb-2" style={{ color: '#5a5550' }}>Amenities & features</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {tagOptions.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={form.tags.includes(t)
                    ? { background: '#1a3d2b', color: '#fff' }
                    : { background: '#fff', color: '#7a7570', border: '1px solid #e2ddd8' }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl mb-4" style={{ background: '#fff', border: '1px solid #e2ddd8' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#141414' }}>Preview</h3>
              {mediaFiles.length > 0 && (
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-stone-100">
                  {mediaFiles[0].type === 'image' ? (
                    <img src={mediaFiles[0].url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaFiles[0].url} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <p className="text-sm font-semibold" style={{ color: '#141414' }}>{form.title || 'Untitled listing'}</p>
              <p className="text-xs" style={{ color: '#7a7570' }}>
                {form.town ? `${form.town}${form.district ? `, ${form.district}` : ''}` : 'Location'} · ₹{form.rent || '—'}/mo
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {form.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>{t}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-2 flex gap-2" style={{ borderTop: '1px solid #e2ddd8', background: '#f7f5f1' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#fff', border: '1px solid #e2ddd8', color: '#5a5550' }}
          >
            Back
          </button>
        )}
        <button
          onClick={async () => {
            if (!isStepValid() || publishing) return
            if (step < 3) {
              setStep(s => s + 1)
            } else {
              setPublishing(true)
              try {
                const firstImage = mediaFiles.find(m => m.type === 'image')?.url
                const formattedListing = {
                  title: form.title,
                  area: form.town,
                  town: form.district,
                  rent: parseInt(form.rent) || 0,
                  bedrooms: parseInt(form.bedrooms) || 1,
                  bathrooms: parseInt(form.bathrooms) || 1,
                  floor: form.floor || 'Ground',
                  tags: form.tags,
                  imageUrl: firstImage || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format',
                  available: form.available ? `From ${new Date(form.available).toLocaleDateString([], {month: 'short', day: 'numeric'})}` : 'Immediate',
                  description: form.description,
                  media: mediaFiles,
                  lat: form.lat,
                  lng: form.lng,
                  ownerName: form.ownerName,
                  ownerPhone: form.ownerPhone,
                  street: form.street,
                  postedByPhone: userProfile?.phone || '+91 99999 88888',
                }
                await onPublish(formattedListing)
              } catch (err) {
                console.error(err)
              } finally {
                setPublishing(false)
              }
            }
          }}
          disabled={!isStepValid() || publishing}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
          style={{ 
            background: '#1a3d2b',
            opacity: (isStepValid() && !publishing) ? 1 : 0.5,
            cursor: (isStepValid() && !publishing) ? 'pointer' : 'not-allowed'
          }}
        >
          {publishing ? 'Publishing...' : step < 3 ? 'Continue' : 'Publish listing'}
        </button>
      </div>
    </div>
  )
}

function ChatListScreen({ conversations, onConvClick }: { conversations: Conversation[]; onConvClick: (c: Conversation) => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#f7f5f1' }}>
      <div className="px-4 pt-12 pb-4">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: '#141414' }}>Messages</h2>
        <p className="text-xs" style={{ color: '#7a7570' }}>{conversations.reduce((a, c) => a + c.unread, 0)} unread</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onConvClick(conv)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white cursor-pointer active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div className="relative shrink-0">
                <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover bg-stone-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#141414' }}>{conv.name}</p>
                  <p className="text-xs" style={{ color: '#7a7570' }}>{conv.time}</p>
                </div>
                <p className="text-xs truncate" style={{ color: '#7a7570' }}>{conv.listing}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: conv.unread > 0 ? '#141414' : '#7a7570', fontWeight: conv.unread > 0 ? 600 : 400 }}>{conv.lastMsg}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#d4652a' }}>
                  {conv.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatDetailScreen({ conv, onBack, user }: { conv: Conversation; onBack: () => void; user: any }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const messagesCol = collection(firestore, 'chats', conv.id, 'messages')
    const unsubscribe = onSnapshot(messagesCol, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Message)
      list.sort((a, b) => a.id.localeCompare(b.id))
      setMessages(list)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, (error) => {
      console.warn("Messages snapshot listener error:", error)
    })
    return () => unsubscribe()
  }, [conv.id])

  const send = async () => {
    if (!text.trim() || !user) return
    const msgId = 'msg_' + Date.now()
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMsg: Message = {
      id: msgId,
      text: text,
      senderId: user.uid,
      sent: true,
      time: timeString
    }
    
    await setDoc(doc(firestore, 'chats', conv.id, 'messages', msgId), newMsg)
    
    const convRef = doc(firestore, 'profiles', user.uid, 'conversations', conv.id)
    await updateDoc(convRef, {
      lastMsg: text,
      time: 'Just now'
    })

    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3" style={{ borderBottom: '1px solid #e2ddd8' }}>
        <button onClick={onBack} style={{ color: '#5a5550' }}><BackIcon /></button>
        <img src={conv.avatar} alt={conv.name} className="w-9 h-9 rounded-full object-cover bg-stone-200" />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#141414' }}>{conv.name}</p>
          <p className="text-xs" style={{ color: '#7a7570' }}>{conv.listing}</p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>Active</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map(msg => {
          const sentByMe = msg.senderId ? msg.senderId === user?.uid : msg.sent
          return (
            <div key={msg.id} className={`flex ${sentByMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-3 py-2 rounded-2xl text-sm"
                style={sentByMe
                  ? { background: '#1a3d2b', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#f7f5f1', color: '#141414', borderBottomLeftRadius: 4 }}
              >
                {msg.text}
                <div className={`text-xs mt-1 ${sentByMe ? 'text-right' : ''}`} style={{ opacity: 0.6 }}>{msg.time}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 pb-8 pt-2" style={{ borderTop: '1px solid #e2ddd8' }}>
        <input
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{ background: '#f7f5f1', border: '1px solid #e2ddd8', color: '#141414' }}
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#1a3d2b', color: '#fff' }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function ProfileScreen({ 
  user, 
  userProfile, 
  listings, 
  conversations,
  onUpdateProfile,
  onSignOut,
  onAuthTrigger,
  onListingClick,
  onCreateClick,
  onDeleteListing,
  onToggleListingStatus
}: { 
  user: any; 
  userProfile: any; 
  listings: Listing[]; 
  conversations: Conversation[];
  onUpdateProfile: (profile: any) => Promise<void>;
  onSignOut: () => void;
  onAuthTrigger: () => void;
  onListingClick?: (l: Listing) => void;
  onCreateClick?: () => void;
  onDeleteListing?: (id: string) => Promise<void>;
  onToggleListingStatus?: (id: string, currentStatus: string) => Promise<void>;
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

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setPhone(userProfile.phone || '')
      setAvatar(userProfile.avatar || '')
    }
  }, [userProfile])

  const myListings = listings.filter(l => 
    (user?.uid && l.postedByUid === user.uid) || 
    (userProfile?.name && l.postedBy === userProfile.name)
  )

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

        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 flex items-center justify-center text-stone-400" style={{ borderColor: '#eaf2ec', background: '#e2ddd8' }}>
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
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#141414' }}>{userProfile?.name || name || user?.displayName || 'User'}</h2>
        <p className="text-sm" style={{ color: '#7a7570' }}>{userProfile?.phone || phone || 'No phone number'} {(userProfile?.email || user?.email) ? `· ${userProfile?.email || user?.email}` : ''}</p>
        <div className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>
          <VerifiedIcon /> {user?.isAnonymous ? 'Guest session' : 'Verified profile'}
        </div>
      </div>

      {error && <div className="mx-4 mb-3 p-3 rounded-xl text-xs font-semibold" style={{ background: '#fdf0e8', color: '#d4652a' }}>{error}</div>}
      {success && <div className="mx-4 mb-3 p-3 rounded-xl text-xs font-semibold" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>{success}</div>}

      {isEditMode && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white border border-hairline">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Edit Profile</h3>
          <input className={inp} style={inpStyle} placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} />
          <input className={inp} style={inpStyle} placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
          <input className={inp} style={inpStyle} placeholder="Avatar URL" value={avatar} onChange={e => setAvatar(e.target.value)} />
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
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white border border-hairline">
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
            ].map((item, i) => (
              <div
                key={item.label}
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

function AuthScreen({
  onSignIn,
  onSignUp,
  onGuest,
  onClose,
  onAdminClick
}: {
  onSignIn: (email: string, pass: string) => Promise<void>
  onSignUp: (email: string, pass: string, name: string, phone: string) => Promise<void>
  onGuest: () => void
  onClose?: () => void
  onAdminClick?: () => void
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await onSignIn(email, password)
      } else {
        if (!name.trim() || !phone.trim()) {
          throw new Error('Name and phone number are required.')
        }
        await onSignUp(email, password, name, phone)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f5f1] overflow-y-auto px-6 py-12 justify-center">
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white border border-[#e2ddd8] flex items-center justify-center text-stone-500 hover:text-stone-700 active:scale-95 transition-transform"
        >
          <BackIcon />
        </button>
      )}

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1a3d2b] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1a3d2b]/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#141414' }}>
            Nestly
          </h2>
          <p className="text-xs mt-1" style={{ color: '#7a7570' }}>
            Your portal to verified spaces
          </p>
        </div>

        <div className="flex bg-[#e2ddd8] p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={isLogin ? { background: '#1a3d2b', color: '#fff', boxShadow: '0 2px 8px rgba(26,61,43,0.15)' } : { color: '#5a5550' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={!isLogin ? { background: '#1a3d2b', color: '#fff', boxShadow: '0 2px 8px rgba(26,61,43,0.15)' } : { color: '#5a5550' }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl text-xs font-semibold animate-shake" style={{ background: '#fdf0e8', color: '#d4652a', border: '1px solid rgba(212,101,42,0.15)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Kabir Singh"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
                  style={{ background: '#fff', color: '#141414' }}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
                  style={{ background: '#fff', color: '#141414' }}
                  required
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
              style={{ background: '#fff', color: '#141414' }}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Password</label>
              {isLogin && (
                <button type="button" className="text-[10px] font-bold text-[#1a3d2b] hover:underline bg-none border-none cursor-pointer">
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
              style={{ background: '#fff', color: '#141414' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            style={{ background: '#1a3d2b', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGuest}
            className="text-xs font-bold text-[#1a3d2b] hover:underline bg-none border-none cursor-pointer mx-auto"
          >
            Continue as Guest
          </button>
          {onAdminClick && (
            <button
              type="button"
              onClick={onAdminClick}
              className="text-[11px] font-bold text-stone-500 hover:text-stone-850 transition-colors mx-auto cursor-pointer"
            >
              🛡️ Admin Access
            </button>
          )}
          <div className="h-[1px] bg-[#e2ddd8] w-full my-1"></div>
          <p className="text-[10px] text-[#7a7570]">
            By continuing, you agree to Nestly's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Screens ───────────────────────────────────────────────────────────

function AdminAuthScreen({
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

function AdminDashboard({
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

  const pendingListings = listings.filter(l => l.status === 'pending')
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
                <p className="text-sm font-semibold">No pending space reviews!</p>
                <p className="text-xs text-slate-400 mt-1">All listings are up-to-date.</p>
              </div>
            ) : (
              pendingListings.map(l => (
                <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex gap-3">
                    <img src={l.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{l.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{l.area}, {l.town}</p>
                      <p className="text-xs text-indigo-600 font-bold mt-1">₹{l.rent.toLocaleString()}/mo</p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">Lister: {l.postedBy}</p>
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
                      Reject
                    </button>
                  </div>
                </div>
              ))
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

// ─── Explore Screen Coordinates & Component ───────────────────────────────────

const LISTING_COORDS: Record<string, [number, number]> = {
  '1': [19.1363, 72.8293],  // Andheri West, Mumbai
  '2': [12.9698, 77.7500],  // Whitefield, Bengaluru
  '3': [17.4156, 78.4347],  // Banjara Hills, Hyderabad
  '4': [28.6447, 77.1906],  // Karol Bagh, Delhi
  '5': [18.9340, 72.8371],  // Fort, Mumbai
}

const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'andheri west': [19.1363, 72.8293],
  'fort': [18.9340, 72.8371],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'whitefield': [12.9698, 77.7500],
  'hyderabad': [17.3850, 78.4867],
  'banjara hills': [17.4156, 78.4347],
  'new delhi': [28.6139, 77.2090],
  'delhi': [28.6139, 77.2090],
  'karol bagh': [28.6447, 77.1906],
}

function ExploreScreen({ listings, onListingClick }: { listings: Listing[]; onListingClick: (l: Listing) => void }) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [radius, setRadius] = useState(2000) // meters
  const [center, setCenter] = useState<[number, number]>([19.1363, 72.8293]) // Andheri West default
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedPreview, setSelectedPreview] = useState<Listing | null>(null)
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const centerMarkerRef = useRef<any>(null)
  const radiusCircleRef = useRef<any>(null)
  const markersGroupRef = useRef<any>(null)

  const SUGGESTION_ITEMS = [
    'Andheri West, Mumbai',
    'Fort, Mumbai',
    'Whitefield, Bengaluru',
    'Banjara Hills, Hyderabad',
    'Karol Bagh, New Delhi',
  ]

  useEffect(() => {
    const L = (window as any).L
    if (L) {
      setMapLoaded(true)
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setMapLoaded(true)
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
          setCenter(coords)
          setRadius(2500) // Set a fresh default radius (2.5 km) around the live location
        },
        (err) => {
          console.warn("User location access failed or denied. Using default center.", err)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [mapLoaded])

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // metres
    const phi1 = lat1 * Math.PI/180
    const phi2 = lat2 * Math.PI/180
    const deltaPhi = (lat2-lat1) * Math.PI/180
    const deltaLambda = (lon2-lon1) * Math.PI/180

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  const listingsInRadius = listings.filter(l => {
    const lat = l.lat ?? LISTING_COORDS[l.id]?.[0]
    const lng = l.lng ?? LISTING_COORDS[l.id]?.[1]
    if (lat === undefined || lng === undefined) return false
    const dist = getDistance(center[0], center[1], lat, lng)
    return dist <= radius
  })

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setSuggestions([])
    
    const q = query.toLowerCase().trim()
    let coords: [number, number] | null = null

    for (const [key, val] of Object.entries(CITY_COORDS)) {
      if (q.includes(key) || key.includes(q)) {
        coords = val
        break
      }
    }

    if (!coords && query.length > 2) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data && data.length > 0) {
          coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        }
      } catch (err) {
        console.error("Geocoding error", err)
      }
    }

    if (coords) {
      setCenter(coords)
      if (mapRef.current) {
        mapRef.current.setView(coords, 13)
      }
    }
  }

  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapLoaded || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, 13)

    mapRef.current = map

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    }).addTo(map)

    const centerIcon = L.divIcon({
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="position: absolute; width: 32px; height: 32px; background: rgba(212, 101, 42, 0.25); border-radius: 50%; animation: pulse 2s infinite ease-in-out;"></div>
          <div style="width: 14px; height: 14px; background: #ffffff; border: 3px solid #d4652a; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      className: 'custom-center-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const centerMarker = L.marker(center, {
      draggable: true,
      icon: centerIcon
    }).addTo(map)

    centerMarkerRef.current = centerMarker

    const radiusCircle = L.circle(center, {
      radius: radius,
      color: '#1a3d2b',
      fillColor: '#1a3d2b',
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(map)

    radiusCircleRef.current = radiusCircle

    const markersGroup = L.layerGroup().addTo(map)
    markersGroupRef.current = markersGroup

    map.on('click', (e: any) => {
      const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng]
      setCenter(newCoords)
      centerMarker.setLatLng(newCoords)
      radiusCircle.setLatLng(newCoords)
    })

    centerMarker.on('drag', (e: any) => {
      const newPos = e.latlng
      radiusCircle.setLatLng(newPos)
    })

    centerMarker.on('dragend', (e: any) => {
      const newPos = e.target.getLatLng()
      setCenter([newPos.lat, newPos.lng])
    })

    return () => {
      map.remove()
      mapRef.current = null
      centerMarkerRef.current = null
      radiusCircleRef.current = null
      markersGroupRef.current = null
    }
  }, [mapLoaded])

  useEffect(() => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(radius)
    }
  }, [radius])

  useEffect(() => {
    if (mapRef.current) {
      const currentView = mapRef.current.getCenter()
      if (Math.abs(currentView.lat - center[0]) > 0.0001 || Math.abs(currentView.lng - center[1]) > 0.0001) {
        mapRef.current.setView(center, mapRef.current.getZoom())
      }
    }
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng(center)
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(center)
    }
  }, [center])

  useEffect(() => {
    const L = (window as any).L
    if (!L || !markersGroupRef.current) return

    markersGroupRef.current.clearLayers()

    listings.forEach(l => {
      const lat = l.lat ?? LISTING_COORDS[l.id]?.[0]
      const lng = l.lng ?? LISTING_COORDS[l.id]?.[1]
      if (lat === undefined || lng === undefined) return

      const coords: [number, number] = [lat, lng]
      const dist = getDistance(center[0], center[1], lat, lng)
      const isInside = dist <= radius

      if (!isInside) return

      const isSelected = selectedPreview?.id === l.id
      const background = isSelected ? '#d4652a' : '#1a3d2b'
      const rentText = l.rent >= 1000 ? `₹${(l.rent / 1000).toFixed(0)}k` : `₹${l.rent}`

      const customIcon = L.divIcon({
        html: `
          <div style="background: ${background}; color: white; font-family: var(--font-sans); font-size: 11px; font-weight: bold; padding: 5px 10px; border-radius: 9999px; border: 1.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25); white-space: nowrap; display: flex; align-items: center; justify-content: center; transform: scale(${isSelected ? 1.12 : 1}); transition: all 0.2s; cursor: pointer;">
            ${rentText}
          </div>
        `,
        className: 'price-marker-icon',
        iconSize: [52, 28],
        iconAnchor: [26, 14]
      })

      const marker = L.marker(coords, { icon: customIcon })
      
      marker.on('click', (e: any) => {
        setSelectedPreview(l)
        const targetLat = coords[0] - 0.003
        mapRef.current.setView([targetLat, coords[1]], mapRef.current.getZoom())
        L.DomEvent.stopPropagation(e)
      })

      markersGroupRef.current.addLayer(marker)
    })
  }, [center, radius, selectedPreview, mapLoaded, listings])

  if (!mapLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6" style={{ background: '#f7f5f1' }}>
        <div className="w-10 h-10 border-4 border-stone-300 border-t-[#1a3d2b] rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold" style={{ color: '#7a7570' }}>Loading interactive map...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: '#e5e3df' }}>
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ height: '100%' }} />

      {/* Floating search layer */}
      <div className="absolute top-12 left-4 right-4 z-[400]">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9d9690' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search address or area..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              if (e.target.value.length > 0) {
                const filtered = SUGGESTION_ITEMS.filter(item => 
                  item.toLowerCase().includes(e.target.value.toLowerCase())
                )
                setSuggestions(filtered)
              } else {
                setSuggestions([])
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery)
              }
            }}
            className="w-full pl-10 pr-10 py-3.5 rounded-2xl text-sm outline-none font-sans"
            style={{
              background: '#fff',
              border: '1px solid #e2ddd8',
              color: '#141414',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSuggestions([])
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: '#7a7570' }}
            >
              <XIcon />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div 
            className="mt-1.5 bg-white rounded-2xl border border-hairline overflow-hidden shadow-xl"
            style={{ maxHeight: 200, overflowY: 'auto' }}
          >
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-stone-50 border-b border-stone-50 last:border-0 flex items-center gap-2"
                style={{ color: '#141414', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LocationIcon size={12} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Radius & Spaces stats badge */}
      <div className="absolute top-28 left-4 z-[400] flex gap-2">
        <div 
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md border"
          style={{ background: '#1a3d2b', color: '#fff', borderColor: '#1a3d2b' }}
        >
          <span>{listingsInRadius.length} spaces here</span>
        </div>
        <div 
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md border"
          style={{ background: '#fff', color: '#1a3d2b', borderColor: '#e2ddd8' }}
        >
          <span>r = {(radius / 1000).toFixed(1)} km</span>
        </div>
      </div>

      {/* Floating Radius Slider Controls Card */}
      <div className="absolute bottom-6 left-4 right-4 z-[400] flex flex-col gap-3">
        
        {/* Radius Slider Card */}
        <div 
          className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-hairline shadow-lg"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-ink uppercase tracking-wider">Search Radius</span>
            <span className="text-sm font-bold text-forest" style={{ fontFamily: 'var(--font-display)' }}>{(radius / 1000).toFixed(1)} km</span>
          </div>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={radius}
            onChange={e => setRadius(parseInt(e.target.value))}
            className="w-full accent-forest cursor-pointer"
            style={{
              height: 4,
              borderRadius: 2,
            }}
          />
          <div className="flex justify-between text-[10px] text-muted font-medium mt-1">
            <span>500 m</span>
            <span>2.5 km</span>
            <span>5.0 km</span>
          </div>
        </div>

        {/* Selected listing preview bottom sheet card */}
        {selectedPreview && (
          <div 
            className="bg-white rounded-3xl p-3 shadow-2xl border border-hairline flex gap-3 animate-slideUp relative"
          >
            {/* Dismiss button */}
            <button 
              onClick={() => setSelectedPreview(null)}
              className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-white rounded-full border border-hairline shadow-md flex items-center justify-center text-stone-500 hover:text-stone-700 active:scale-90 transition-transform"
              style={{ border: '1px solid #e2ddd8', background: '#fff', cursor: 'pointer' }}
            >
              <XIcon />
            </button>

            {/* Listing Image */}
            <div 
              onClick={() => onListingClick(selectedPreview)}
              className="relative shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform" 
              style={{ width: 100, height: 100 }}
            >
              <img src={selectedPreview.imageUrl} alt={selectedPreview.title} className="w-full h-full object-cover bg-stone-100" />
              <span 
                className="absolute bottom-1.5 left-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: selectedPreview.available === 'Immediate' ? '#d4652a' : '#1a3d2b' }}
              >
                {selectedPreview.available}
              </span>
            </div>

            {/* Listing Info */}
            <div 
              onClick={() => onListingClick(selectedPreview)}
              className="flex-1 min-w-0 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <h4 className="font-bold text-sm text-ink truncate">{selectedPreview.title}</h4>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                  <LocationIcon size={10} />
                  <span className="truncate">{selectedPreview.area}, {selectedPreview.town}</span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5 text-muted text-[10px]">
                  <span className="flex items-center gap-0.5"><BedIcon />{selectedPreview.bedrooms}bd</span>
                  <span className="flex items-center gap-0.5"><BathIcon />{selectedPreview.bathrooms}ba</span>
                  <span className="flex items-center gap-0.5"><FloorIcon />{selectedPreview.floor === 'Ground' ? 'G floor' : selectedPreview.floor ? `Floor ${selectedPreview.floor}` : selectedPreview.sqft ? `${selectedPreview.sqft}ft²` : 'G floor'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-forest" style={{ fontFamily: 'var(--font-display)' }}>
                    ₹{selectedPreview.rent.toLocaleString()}
                    <span className="text-[10px] font-normal text-muted">/mo</span>
                  </span>
                  <span className="text-[10px] text-amber font-semibold uppercase tracking-wider">View Details →</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({
  active,
  onNav,
  onCreate,
}: {
  active: 'home' | 'explore' | 'chat' | 'profile'
  onNav: (s: 'home' | 'explore' | 'chat' | 'profile') => void
  onCreate: () => void
}) {
  return (
    <div
      className="flex items-center justify-around px-2 pb-2 pt-2"
      style={{
        background: '#fff',
        borderTop: '1px solid #e2ddd8',
        position: 'relative',
      }}
    >
      <button className="flex flex-col items-center gap-0.5 flex-1 py-1" onClick={() => onNav('home')}>
        <HomeIcon active={active === 'home'} />
        <span className="text-xs font-medium" style={{ color: active === 'home' ? '#1a3d2b' : '#7a7570' }}>Home</span>
      </button>
      <button className="flex flex-col items-center gap-0.5 flex-1 py-1" onClick={() => onNav('explore')}>
        <ExploreIcon active={active === 'explore'} />
        <span className="text-xs font-medium" style={{ color: active === 'explore' ? '#1a3d2b' : '#7a7570' }}>Explore</span>
      </button>
      {/* Plus button */}
      <div className="flex flex-col items-center flex-1 -mt-6">
        <button
          onClick={onCreate}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ background: '#1a3d2b', boxShadow: '0 4px 16px rgba(26,61,43,0.35)' }}
        >
          <PlusIcon />
        </button>
        <span className="text-xs font-medium mt-1" style={{ color: '#7a7570' }}>List</span>
      </div>
      <button className="flex flex-col items-center gap-0.5 flex-1 py-1" onClick={() => onNav('chat')}>
        <ChatIcon active={active === 'chat'} />
        <span className="text-xs font-medium" style={{ color: active === 'chat' ? '#1a3d2b' : '#7a7570' }}>Messages</span>
      </button>
      <button className="flex flex-col items-center gap-0.5 flex-1 py-1" onClick={() => onNav('profile')}>
        <ProfileIcon active={active === 'profile'} />
        <span className="text-xs font-medium" style={{ color: active === 'profile' ? '#1a3d2b' : '#7a7570' }}>Profile</span>
      </button>
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=800&fit=crop&auto=format',
      tag: 'For renters',
      title: 'Find your next home',
      body: 'Browse hundreds of verified apartments and connect directly with the people leaving them.',
    },
    {
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=800&fit=crop&auto=format',
      tag: 'For listers',
      title: 'List your space in minutes',
      body: 'Moving out? Upload photos, set your rent, and keep your exact address private until you\'re ready.',
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=800&fit=crop&auto=format',
      tag: 'Privacy first',
      title: 'Only your area, never your address',
      body: 'Searchers see your neighbourhood. You share your full address only after a direct chat.',
    },
  ]
  const s = slides[step]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#141414' }}>
      <div className="relative flex-1">
        <img src={s.image} alt={s.title} className="w-full h-full object-cover" style={{ opacity: 0.55 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #141414 38%, transparent 70%)' }} />

        {/* Dots */}
        <div className="absolute top-14 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className="h-1 rounded-full transition-all" style={{ width: i === step ? 20 : 6, background: i === step ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4652a' }}>{s.tag}</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginTop: 8, marginBottom: 12 }}>
            {s.title}
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.body}</p>
          <div className="flex gap-3">
            {step < slides.length - 1 ? (
              <>
                <button onClick={onDone} className="flex-1 py-3.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                  Skip
                </button>
                <button onClick={() => setStep(s => s + 1)} className="flex-[2] py-3.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#1a3d2b' }}>
                  Next
                </button>
              </>
            ) : (
              <button onClick={onDone} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#1a3d2b' }}>
                Get started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function mapDatabaseListing(key: string, raw: any): Listing {
  const photos = raw.photos || []
  const publicLocation = raw.publicLocation || {}
  const exactLocation = raw.exactLocation || {}
  
  const amenities = Array.isArray(raw.amenities) ? raw.amenities : []
  const tags = Array.isArray(raw.tags) ? raw.tags : []
  const combinedTags = [...amenities, ...tags]
  if (raw.furnishing) {
    const furn = raw.furnishing.charAt(0).toUpperCase() + raw.furnishing.slice(1)
    if (!combinedTags.includes(furn)) {
      combinedTags.push(furn)
    }
  }

  let bedrooms = 1
  if (raw.roomCount) {
    bedrooms = parseInt(raw.roomCount) || 1
  } else if (raw.bedrooms) {
    bedrooms = parseInt(raw.bedrooms) || 1
  } else if (raw.bhkType) {
    bedrooms = parseInt(raw.bhkType) || 1
  }

  return {
    id: key || raw.id || String(Date.now()),
    title: raw.title || "Untitled Space",
    area: publicLocation.locality || raw.area || "Kestopur",
    town: publicLocation.city || raw.town || "Kolkata",
    rent: Number(raw.rent) || 0,
    bedrooms,
    bathrooms: Number(raw.bathrooms) || 1,
    floor: raw.floor || 'Ground',
    tags: combinedTags,
    lat: exactLocation.lat || raw.lat,
    lng: exactLocation.lng || raw.lng,
    postedBy: raw.postedBy || 'Anonymous User',
    postedByAvatar: raw.postedByAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format',
    postedByUid: raw.postedByUid || '',
    media: Array.isArray(raw.media) ? raw.media : [],
    imageUrl: raw.imageUrl || (Array.isArray(raw.media) && raw.media.find((m: any) => m.type === 'image')?.url) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format',
    verified: !!raw.verified,
    available: raw.available || 'Immediate',
    description: raw.description || '',
    postedByPhone: raw.postedByPhone || '+91 99999 88888',
    ownerName: raw.ownerName || 'Kabir Singh',
    ownerPhone: raw.ownerPhone || '+91 98765 43210',
    street: raw.street || 'Flat 4B, Sunrise Apartments, MG Road',
    featured: !!raw.featured,
    status: raw.status || 'active',
    rejectionReason: raw.rejectionReason || '',
  }
}

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('nestly_onboarded') === 'true')
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = sessionStorage.getItem('nestly_current_screen')
    return (saved as Screen) || 'home'
  })
  const [navTab, setNavTab] = useState<'home' | 'explore' | 'chat' | 'profile'>(() => {
    const saved = sessionStorage.getItem('nestly_current_nav_tab')
    return (saved as any) || 'home'
  })

  useEffect(() => {
    sessionStorage.setItem('nestly_current_screen', screen)
  }, [screen])

  useEffect(() => {
    sessionStorage.setItem('nestly_current_nav_tab', navTab)
  }, [navTab])

  const [selectedListing, setSelectedListing] = useState<Listing | null>(() => {
    try {
      const savedData = sessionStorage.getItem('nestly_selected_listing_data')
      return savedData ? JSON.parse(savedData) : null
    } catch (e) {
      return null
    }
  })

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(() => {
    try {
      const savedData = sessionStorage.getItem('nestly_selected_conv_data')
      return savedData ? JSON.parse(savedData) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (selectedListing) {
      sessionStorage.setItem('nestly_selected_listing_id', selectedListing.id)
      sessionStorage.setItem('nestly_selected_listing_data', JSON.stringify(selectedListing))
    }
  }, [selectedListing])

  useEffect(() => {
    if (selectedConv) {
      sessionStorage.setItem('nestly_selected_conv_id', selectedConv.id)
      sessionStorage.setItem('nestly_selected_conv_data', JSON.stringify(selectedConv))
    }
  }, [selectedConv])

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unlockedListings, setUnlockedListings] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nestly_unlocked_listings')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  const handleUnlockListing = (id: string) => {
    setUnlockedListings(prev => {
      const next = { ...prev, [id]: true }
      try {
        localStorage.setItem('nestly_unlocked_listings', JSON.stringify(next))
      } catch (e) {}
      return next
    })
  }

  const getOrCreateGuestUser = () => {
    const storedUid = sessionStorage.getItem('nestly_user_uid')
    const authType = sessionStorage.getItem('nestly_auth_type')
    if (storedUid && authType === 'guest') {
      return { isAnonymous: true, uid: storedUid, displayName: 'Guest User', photoURL: '' }
    }
    const guestUid = 'guest_' + Date.now()
    sessionStorage.setItem('nestly_user_uid', guestUid)
    sessionStorage.setItem('nestly_auth_type', 'guest')
    return { isAnonymous: true, uid: guestUid, displayName: 'Guest User', photoURL: '' }
  }



  useEffect(() => {
    const listingsCol = collection(firestore, 'listings')
    const unsubscribe = onSnapshot(listingsCol, (snapshot) => {
      const list = snapshot.docs
        .filter(docSnap => {
          const raw = docSnap.data()
          return raw && raw.status !== 'draft'
        })
        .map(docSnap => mapDatabaseListing(docSnap.id, docSnap.data()))
      setListings(list)
    }, (error) => {
      console.warn("Listings snapshot listener error:", error)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        sessionStorage.setItem('nestly_user_uid', authUser.uid)
        const currentAuthType = sessionStorage.getItem('nestly_auth_type')
        const isCurrentlyAdmin = currentAuthType === 'admin'
        setUser(authUser)
        
        let isAdminUser = false
        if (isCurrentlyAdmin) {
          try {
            // Give 100ms for Firebase Auth token to sync with Firestore
            await new Promise(resolve => setTimeout(resolve, 100))
            const adminDocRef = doc(firestore, 'admins', authUser.uid)
            const adminDoc = await getDoc(adminDocRef)
            if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
              isAdminUser = true
            }
          } catch (err) {
            console.warn("Failed to fetch admin status during state change:", err)
          }
        }

        if (isAdminUser) {
          sessionStorage.setItem('nestly_auth_type', 'admin')
          setIsAdmin(true)
          setScreen('admin-dashboard')
        } else {
          sessionStorage.setItem('nestly_auth_type', 'real')
          setIsAdmin(false)
          const profileDocRef = doc(firestore, 'profiles', authUser.uid)
          onSnapshot(profileDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data())
            } else {
              const defaultProfile = {
                name: authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'User'),
                avatar: authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&auto=format',
                phone: authUser.phoneNumber || '',
                email: authUser.email || '',
                joined: 'Aug 2026'
              }
              setDoc(profileDocRef, defaultProfile)
              setUserProfile(defaultProfile)
            }
          }, (error) => {
            console.warn("Profile snapshot listener error:", error)
          })
        }
      } else {
        const savedUid = sessionStorage.getItem('nestly_user_uid')
        const authType = sessionStorage.getItem('nestly_auth_type')
        if (savedUid && authType === 'real') {
          const simulatedUser = {
            uid: savedUid,
            isAnonymous: false,
            displayName: 'Logged In User',
            email: ''
          }
          setUser(simulatedUser)
          const profileDocRef = doc(firestore, 'profiles', savedUid)
          onSnapshot(profileDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data())
            }
          }, (error) => {
            console.warn("Simulated user profile snapshot listener error:", error)
          })
        } else {
          const guestUser = getOrCreateGuestUser()
          setUser(guestUser)
          setUserProfile({
            name: 'Guest User',
            avatar: '',
            phone: 'None',
            email: 'guest@nestly.com',
            joined: 'Just now'
          })
        }
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setConversations([])
      return
    }
    const convsCol = collection(firestore, 'profiles', user.uid, 'conversations')
    const unsubscribe = onSnapshot(convsCol, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Conversation)
      setConversations(list)
    }, (error) => {
      console.warn("Conversations listener error/denied:", error)
    })
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || user.isAnonymous) return
    const convsCol = collection(firestore, 'profiles', user.uid, 'conversations')
    getDocs(convsCol).then((snapshot) => {
      if (snapshot.empty) {
        CONVERSATIONS.forEach(async (c) => {
          await setDoc(doc(convsCol, c.id), c)
        })
        
        MESSAGES.forEach(async (m) => {
          await setDoc(doc(firestore, 'chats', 'c1', 'messages', m.id), m)
        })
      }
    }).catch(err => {
      console.warn("Conversations pre-fetch warning:", err)
    })
  }, [user])

  const handleUpdateProfile = async (profileData: { name: string; phone: string; avatar: string }) => {
    if (!user || user.isAnonymous) return
    const profileRef = doc(firestore, 'profiles', user.uid)
    await updateDoc(profileRef, profileData)
    if (user.displayName !== profileData.name || user.photoURL !== profileData.avatar) {
      await updateProfile(user, {
        displayName: profileData.name,
        photoURL: profileData.avatar
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      sessionStorage.removeItem('nestly_user_uid')
      sessionStorage.removeItem('nestly_auth_type')
      setUser(null)
      setUserProfile(null)
      setScreen('auth')
      setNavTab('home')
    } catch (err) {
      console.error(err)
    }
  }

  const handleSignIn = async (emailVal: string, passVal: string) => {
    await signInWithEmailAndPassword(auth, emailVal, passVal)
  }

  const handleSignUp = async (emailVal: string, passVal: string, nameVal: string, phoneVal: string) => {
    const credentials = await createUserWithEmailAndPassword(auth, emailVal, passVal)
    const profileData = {
      name: nameVal,
      phone: phoneVal,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&auto=format',
      email: emailVal,
      joined: 'Aug 2026'
    }
    await setDoc(doc(firestore, 'profiles', credentials.user.uid), profileData)
    await updateProfile(credentials.user, {
      displayName: nameVal,
      photoURL: profileData.avatar
    })
  }

  const handleAdminSignIn = async (emailVal: string, passVal: string): Promise<boolean> => {
    const credentials = await signInWithEmailAndPassword(auth, emailVal, passVal)
    const adminDocRef = doc(firestore, 'admins', credentials.user.uid)
    const adminDoc = await getDoc(adminDocRef)
    if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
      sessionStorage.setItem('nestly_user_uid', credentials.user.uid)
      sessionStorage.setItem('nestly_auth_type', 'admin')
      setIsAdmin(true)
      setUser(credentials.user)
      setScreen('admin-dashboard')
      return true
    } else {
      await signOut(auth)
      setIsAdmin(false)
      setUser(null)
      return false
    }
  }

  const handleAdminSignUp = async (emailVal: string, passVal: string, nameVal: string) => {
    const credentials = await createUserWithEmailAndPassword(auth, emailVal, passVal)
    const adminData = {
      isAdmin: false,
      name: nameVal,
      email: emailVal,
      createdAt: new Date().toISOString()
    }
    await setDoc(doc(firestore, 'admins', credentials.user.uid), adminData)
    await signOut(auth)
  }

  const handleAdminSignOut = async () => {
    await signOut(auth)
    setIsAdmin(false)
    setUser(null)
    setScreen('home')
    setNavTab('home')
  }

  const handleOnboardingDone = () => {
    localStorage.setItem('nestly_onboarded', 'true')
    sessionStorage.setItem('nestly_current_screen', 'auth')
    setOnboarded(true)
    setScreen('auth')
  }

  if (!onboarded) return <OnboardingScreen onDone={handleOnboardingDone} />

  const showNav = ['home', 'explore', 'chat', 'profile'].includes(screen)

  const handleNav = (tab: 'home' | 'explore' | 'chat' | 'profile') => {
    setNavTab(tab)
    setScreen(tab)
  }

  useEffect(() => {
    if (screen === 'listing-detail') {
      if (!user || user.isAnonymous) {
        setScreen('auth')
        return
      }
      if (listings.length > 0) {
        const savedId = sessionStorage.getItem('nestly_selected_listing_id')
        if (savedId) {
          const match = listings.find(l => l.id === savedId)
          if (match) {
            setSelectedListing(match)
          }
        }
      }
    }
  }, [listings, screen, user])

  useEffect(() => {
    if (screen === 'listing-detail' && !selectedListing) {
      const timer = setTimeout(() => {
        const savedData = sessionStorage.getItem('nestly_selected_listing_data')
        if (savedData) {
          try {
            setSelectedListing(JSON.parse(savedData))
            return
          } catch (e) {}
        }
        setScreen('home')
        setNavTab('home')
      }, 1200)
      return () => clearTimeout(timer)
    }

    if (screen === 'chat-detail' && !selectedConv) {
      const timer = setTimeout(() => {
        const savedData = sessionStorage.getItem('nestly_selected_conv_data')
        if (savedData) {
          try {
            setSelectedConv(JSON.parse(savedData))
            return
          } catch (e) {}
        }
        setScreen('chat')
        setNavTab('chat')
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [screen, selectedListing, selectedConv])

  const handleListingClick = (l: Listing) => {
    if (!user || user.isAnonymous) {
      setScreen('auth')
      return
    }
    setSelectedListing(l)
    sessionStorage.setItem('nestly_selected_listing_id', l.id)
    sessionStorage.setItem('nestly_selected_listing_data', JSON.stringify(l))
    setScreen('listing-detail')
  }

  const handleConvClick = (c: Conversation) => {
    setSelectedConv(c)
    sessionStorage.setItem('nestly_selected_conv_id', c.id)
    sessionStorage.setItem('nestly_selected_conv_data', JSON.stringify(c))
    setScreen('chat-detail')
  }

  const activeListings = listings.filter(l => l.status === 'active' || !l.status)

  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: 430,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f7f5f1',
      }}
    >
      <div className="flex-1 overflow-hidden relative">
        {screen === 'home' && (
          <HomeScreen listings={activeListings} onListingClick={handleListingClick} />
        )}
        {screen === 'explore' && (
          <ExploreScreen listings={activeListings} onListingClick={handleListingClick} />
        )}
        {screen === 'create' && (
          <CreateScreen 
            userProfile={userProfile}
            onClose={() => { setScreen('home'); setNavTab('home') }} 
            onPublish={async (newListingData) => {
              const listingsCol = collection(firestore, 'listings')
              const newListingDoc = doc(listingsCol)
              
              let coords: [number, number] = [19.0760, 72.8777] // default Mumbai
              if (newListingData.lat !== undefined && newListingData.lng !== undefined && newListingData.lat !== null && newListingData.lng !== null) {
                coords = [newListingData.lat, newListingData.lng]
              } else {
                const query = `${newListingData.town}, ${newListingData.area || ''}`.trim()
                const q = query.toLowerCase()
                for (const [key, val] of Object.entries(CITY_COORDS)) {
                  if (q.includes(key) || key.includes(q)) {
                    coords = val
                    break
                  }
                }
                
                if (query.length > 2) {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
                    const data = await res.json()
                    if (data && data.length > 0) {
                      coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
                    }
                  } catch (e) {
                    console.error(e)
                  }
                }
              }

              const newListing: Listing & { status: string; postedByUid?: string; media?: any[] } = {
                id: newListingDoc.id,
                ...newListingData,
                status: 'pending',
                lat: coords[0],
                lng: coords[1],
                verified: false,
                postedBy: userProfile?.name || 'Anonymous User',
                postedByAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format',
                postedByUid: user?.uid,
              }

              await setDoc(newListingDoc, newListing)
              setScreen('home')
              setNavTab('home')
            }}
          />
        )}
        {screen === 'chat' && (
          <ChatListScreen conversations={conversations} onConvClick={handleConvClick} />
        )}
        {screen === 'chat-detail' && (
          selectedConv ? (
            <ChatDetailScreen conv={selectedConv} onBack={() => setScreen('chat')} user={user} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#f7f5f1] p-6 text-center">
              <div className="w-8 h-8 border-4 border-[#1a3d2b]/30 border-t-[#1a3d2b] rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-stone-600">Loading conversation...</p>
            </div>
          )
        )}
        {screen === 'profile' && (
          <ProfileScreen 
            user={user}
            userProfile={userProfile}
            listings={listings}
            conversations={conversations}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
            onAuthTrigger={() => setScreen('auth')}
            onListingClick={handleListingClick}
            onCreateClick={() => setScreen('create')}
            onDeleteListing={async (id) => {
              await deleteDoc(doc(firestore, 'listings', id))
            }}
            onToggleListingStatus={async (id, currentStatus) => {
              const nextStatus = currentStatus === 'paused' ? 'active' : 'paused'
              await updateDoc(doc(firestore, 'listings', id), { status: nextStatus })
            }}
          />
        )}
        {screen === 'listing-detail' && (
          selectedListing ? (
            <ListingDetailScreen
              listing={selectedListing}
              isUnlocked={Boolean(user?.uid && selectedListing.postedByUid && selectedListing.postedByUid === user.uid) || !!unlockedListings[selectedListing.id]}
              onUnlock={handleUnlockListing}
              user={user}
              userProfile={userProfile}
              onBack={() => setScreen(navTab)}
              onChat={async () => {
                if (!user) return
                const convId = `conv_${selectedListing.id}_${user.uid}`
                const convRef = doc(firestore, 'profiles', user.uid, 'conversations', convId)
                const docSnap = await getDoc(convRef)
                
                let convData = docSnap.exists() ? docSnap.data() as Conversation : null
                if (!convData) {
                  convData = {
                    id: convId,
                    name: selectedListing.postedBy,
                    avatar: selectedListing.postedByAvatar,
                    lastMsg: `Hi! I saw your listing for the ${selectedListing.title}.`,
                    time: 'Just now',
                    unread: 0,
                    listing: `${selectedListing.title} · ${selectedListing.town}`
                  }
                  await setDoc(convRef, convData)
                  
                  const msgId = 'welcome_' + Date.now()
                  await setDoc(doc(firestore, 'chats', convId, 'messages', msgId), {
                    id: msgId,
                    text: `Hi! I saw your listing for the ${selectedListing.title}.`,
                    senderId: user.uid,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  })
                }
                
                setSelectedConv(convData)
                setNavTab('chat')
                setScreen('chat-detail')
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#f7f5f1] p-6 text-center">
              <div className="w-8 h-8 border-4 border-[#1a3d2b]/30 border-t-[#1a3d2b] rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-stone-600">Loading space details...</p>
            </div>
          )
        )}
        {screen === 'auth' && (
          <AuthScreen 
            onSignIn={async (emailVal, passVal) => {
              await handleSignIn(emailVal, passVal)
              setScreen('home')
              setNavTab('home')
            }}
            onSignUp={async (emailVal, passVal, nameVal, phoneVal) => {
              await handleSignUp(emailVal, passVal, nameVal, phoneVal)
              setScreen('home')
              setNavTab('home')
            }}
            onGuest={() => {
              signOut(auth).catch(() => {})
              const guestUser = getOrCreateGuestUser()
              setUser(guestUser)
              setUserProfile({
                name: 'Guest User',
                avatar: '',
                phone: 'None',
                email: 'guest@nestly.com',
                joined: 'Just now'
              })
              setScreen('home')
              setNavTab('home')
            }}
            onClose={user ? () => { setScreen('home'); setNavTab('home') } : undefined}
            onAdminClick={() => setScreen('admin-auth')}
          />
        )}
        {screen === 'admin-auth' && (
          <AdminAuthScreen
            onAdminSignIn={handleAdminSignIn}
            onAdminSignUp={handleAdminSignUp}
            onClose={() => setScreen('auth')}
          />
        )}
        {screen === 'admin-dashboard' && (
          <AdminDashboard
            listings={listings}
            onSignOut={handleAdminSignOut}
            onListingClick={handleListingClick}
          />
        )}
      </div>

      {showNav && (
        <BottomNav
          active={navTab}
          onNav={handleNav}
          onCreate={() => {
            if (user?.isAnonymous) {
              setScreen('auth')
            } else {
              setScreen('create')
              setNavTab('home')
            }
          }}
        />
      )}
    </div>
  )
}
