export type Screen = 
  | 'home' 
  | 'explore' 
  | 'create' 
  | 'chat' 
  | 'chat-detail' 
  | 'profile' 
  | 'listing-detail' 
  | 'auth' 
  | 'admin-auth' 
  | 'admin-dashboard' 
  | 'terms' 
  | 'privacy' 
  | 'refund' 
  | 'pass' 
  | 'premium'

export interface PassPlan {
  id: string
  name: string
  price: number
  views: number
  tokens: number
  pricePerView: number
  badge?: string
  popular?: boolean
  description: string
  features?: string[]
}

export const PASS_PLANS: PassPlan[] = [
  {
    id: 'pass_499',
    name: 'Starter Plan',
    price: 499,
    views: 6,
    tokens: 6,
    pricePerView: 83,
    badge: 'Starter',
    description: 'Get 6 tokens to view lister details, contact & schedule flat visits',
    features: [
      '6 Flat Unlock Tokens',
      'Direct Lister Mobile & Full Address',
      'Contact & Arrange Flat Visits',
      '₹2,000 Standard Brokerage payable post-visit'
    ]
  },
  {
    id: 'pass_599',
    name: 'Popular Plan',
    price: 599,
    views: 7,
    tokens: 7,
    pricePerView: 85,
    badge: 'Most Popular',
    popular: true,
    description: 'Get 7 tokens to view lister details, contact & schedule flat visits',
    features: [
      '7 Flat Unlock Tokens',
      'Direct Lister Mobile & Full Address',
      'Contact & Arrange Flat Visits',
      '₹2,000 Standard Brokerage payable post-visit'
    ]
  },
  {
    id: 'pass_699',
    name: 'Value Plan',
    price: 699,
    views: 10,
    tokens: 10,
    pricePerView: 70,
    badge: 'Best Value',
    description: 'Get 10 tokens to view lister details, contact & schedule flat visits',
    features: [
      '10 Flat Unlock Tokens (Maximum Savings)',
      'Direct Lister Mobile & Full Address',
      'Contact & Arrange Flat Visits',
      '₹2,000 Standard Brokerage payable post-visit'
    ]
  }
]

export const POST_VISIT_BROKERAGE_FEE = 2000

export const BROKER_SERVICE = {
  id: 'broker_2000',
  name: 'Post-Visit Flat Brokerage',
  price: 2000,
  description: 'Standard flat brokerage fee of ₹2,000 charged and payable through the app after your physical flat visit'
}

export interface Listing {
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
  sqft?: number
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  lastMsg: string
  time: string
  unread: number
  listing: string
}

export interface Message {
  id: string
  text: string
  sent: boolean
  time: string
  senderId?: string
}

export const LISTING_COORDS: Record<string, [number, number]> = {
  '1': [19.1363, 72.8293],  // Andheri West, Mumbai
  '2': [12.9698, 77.7500],  // Whitefield, Bengaluru
  '3': [17.4156, 78.4347],  // Banjara Hills, Hyderabad
  '4': [28.6447, 77.1906],  // Karol Bagh, Delhi
  '5': [18.9340, 72.8371],  // Fort, Mumbai
}

export const CITY_COORDS: Record<string, [number, number]> = {
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

export function getOrCreateGuestUser() {
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

export function mapDatabaseListing(key: string, raw: any): Listing {
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
