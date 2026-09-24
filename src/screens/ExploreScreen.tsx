import React, { useState, useRef, useEffect } from 'react'
import { Listing, LISTING_COORDS, CITY_COORDS } from '../types'
import { SearchIcon, XIcon, LocationIcon, BedIcon, BathIcon, FloorIcon } from '../components/Icons'

export function ExploreScreen({ listings, onListingClick }: { listings: Listing[]; onListingClick: (l: Listing) => void }) {
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

    if (!coords) {
      // fallback
    } else {
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

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
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
            className="mt-1.5 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xl"
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
          className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-stone-200 shadow-lg"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">Search Radius</span>
            <span className="text-sm font-bold text-[#1a3d2b]" style={{ fontFamily: 'var(--font-display)' }}>{(radius / 1000).toFixed(1)} km</span>
          </div>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={radius}
            onChange={e => setRadius(parseInt(e.target.value))}
            className="w-full accent-[#1a3d2b] cursor-pointer"
            style={{
              height: 4,
              borderRadius: 2,
            }}
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-medium mt-1">
            <span>500 m</span>
            <span>2.5 km</span>
            <span>5.0 km</span>
          </div>
        </div>

        {/* Selected listing preview bottom sheet card */}
        {selectedPreview && (
          <div 
            className="bg-white rounded-3xl p-3 shadow-2xl border border-stone-200 flex gap-3 relative"
          >
            {/* Dismiss button */}
            <button 
              onClick={() => setSelectedPreview(null)}
              className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-white rounded-full border border-stone-200 shadow-md flex items-center justify-center text-stone-500 hover:text-stone-700 active:scale-90 transition-transform"
              style={{ cursor: 'pointer' }}
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
                <h4 className="font-bold text-sm text-stone-900 truncate">{selectedPreview.title}</h4>
                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                  <LocationIcon size={10} />
                  <span className="truncate">{selectedPreview.area}, {selectedPreview.town}</span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5 text-stone-500 text-[10px]">
                  <span className="flex items-center gap-0.5"><BedIcon />{selectedPreview.bedrooms}bd</span>
                  <span className="flex items-center gap-0.5"><BathIcon />{selectedPreview.bathrooms}ba</span>
                  <span className="flex items-center gap-0.5"><FloorIcon />{selectedPreview.floor === 'Ground' ? 'G floor' : selectedPreview.floor ? `Floor ${selectedPreview.floor}` : selectedPreview.sqft ? `${selectedPreview.sqft}ft²` : 'G floor'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#1a3d2b]" style={{ fontFamily: 'var(--font-display)' }}>
                    ₹{selectedPreview.rent.toLocaleString()}
                    <span className="text-[10px] font-normal text-stone-500">/mo</span>
                  </span>
                  <span className="text-[10px] text-[#d4652a] font-semibold uppercase tracking-wider">View Details →</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default ExploreScreen
