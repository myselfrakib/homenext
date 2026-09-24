import React, { useState, useRef, useEffect } from 'react'
import { Listing } from '../types'
import { LocationIcon } from './Icons'

export function MapModal({ 
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
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
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

export function LocationPickerModal({
  initialLat,
  initialLng,
  onConfirm,
  onClose
}: {
  initialLat: number | null;
  initialLng: number | null;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  
  const lat = initialLat || 22.5726
  const lng = initialLng || 88.3639
  
  const [selectedCoords, setSelectedCoords] = useState({ lat, lng })
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current) return
    const L = (window as any).L
    if (!L) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false
    }).setView([lat, lng], 15)

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    mapRef.current = map

    map.on('move', () => {
      const center = map.getCenter()
      setSelectedCoords({ lat: center.lat, lng: center.lng })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16)
        }
        setLocating(false)
      },
      (err) => {
        console.error(err)
        alert("Failed to access your location. Please check browser permissions.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSave = () => {
    onConfirm(selectedCoords.lat, selectedCoords.lng)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#141414]/90 animate-fade-in" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-stone-200">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Select Location on Map</h3>
          <p className="text-[10px] text-stone-500 mt-0.5">Move the map to align the target pointer with your building</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 text-stone-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative bg-stone-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        <div className="absolute top-1/2 left-1/2 -mt-9 -ml-4 z-50 pointer-events-none flex flex-col items-center">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-600 drop-shadow-md filter" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="w-1.5 h-1.5 bg-rose-600 rounded-full border border-white -mt-0.5 shadow-md"></div>
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          className="absolute bottom-6 right-6 z-50 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform border border-stone-200"
        >
          {locating ? (
            <div className="w-5 h-5 border-2 border-emerald-800/30 border-t-emerald-800 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8a4 4 0 110 8 4 4 0 010-8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
          )}
        </button>
      </div>

      <div className="bg-white px-4 py-4 border-t border-stone-200 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-stone-600 text-xs">
          <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate font-semibold">Verify the pointer is aligned with your building</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md active:scale-[0.99] transition-transform"
          style={{ background: '#1a3d2b' }}
        >
          Confirm Location Coordinates
        </button>
      </div>
    </div>
  )
}

export function RazorpayCheckoutModal({
  listing,
  feeAmount,
  title,
  subtitle,
  amount,
  benefits,
  onSuccess,
  onClose
}: {
  listing?: Listing
  feeAmount?: number
  title?: string
  subtitle?: string
  amount?: number
  benefits?: string[]
  onSuccess: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const payAmount = amount ?? feeAmount ?? 499
  const payTitle = title ?? listing?.title ?? 'Nestly Pass Plan'
  const paySubtitle = subtitle ?? 'Nestly Property Platform'

  const defaultBenefits = [
    'Full Lister Name & Direct Mobile Number',
    'Exact Street Address & Interactive Map',
    'Direct Chat & Calling Access with Lister',
    'Arrange Flat Visit (₹2,000 Brokerage payable post-visit)'
  ]

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
              <p className="text-[10px] text-blue-200 mt-0.5">{paySubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white font-bold text-lg">×</button>
        </div>

        <div className="p-5">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-stone-500 font-medium truncate">{paySubtitle}</p>
              <p className="text-sm font-bold text-stone-900 truncate">{payTitle}</p>
            </div>
            <p className="font-mono text-lg font-bold text-[#1a3d2b] shrink-0">₹{payAmount.toLocaleString()}</p>
          </div>

          <div className="space-y-2 mb-5">
            <p className="text-xs font-semibold text-stone-700">What you get after payment:</p>
            {(benefits || defaultBenefits).map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>{b}</span>
              </div>
            ))}
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
                <span>Pay ₹{payAmount.toLocaleString()} via Razorpay</span>
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
