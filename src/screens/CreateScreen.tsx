import React, { useState, useEffect, useRef } from 'react'
import { storage } from '../firebase'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Listing } from '../types'
import { XIcon, LocationIcon, CameraIcon } from '../components/Icons'
import { LocationPickerModal } from '../components/Modals'

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a5550' }}>{label}</label>
      {children}
    </div>
  )
}

export function CreateScreen({ 
  onClose, 
  onPublish, 
  userProfile, 
  initialData 
}: { 
  onClose: () => void; 
  onPublish: (data: any) => Promise<void>; 
  userProfile?: any; 
  initialData?: Listing 
}) {
  const [step, setStep] = useState(1)
  const [publishing, setPublishing] = useState(false)
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || '',
        street: initialData.street || '',
        town: initialData.area || '',
        district: initialData.town || '',
        state: '',
        pin: '',
        rent: initialData.rent ? String(initialData.rent) : '',
        deposit: '',
        bedrooms: initialData.bedrooms ? String(initialData.bedrooms) : '1',
        bathrooms: initialData.bathrooms ? String(initialData.bathrooms) : '1',
        floor: initialData.floor || 'Ground',
        description: initialData.description || '',
        furnished: 'Unfurnished',
        available: '',
        tags: initialData.tags || [],
        lat: initialData.lat || null,
        lng: initialData.lng || null,
        ownerName: initialData.ownerName || '',
        ownerPhone: initialData.ownerPhone || '+91 ',
      }
    }
    return {
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
      available: (() => {
        const d = new Date()
        d.setMonth(d.getMonth() + 1)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        return `${yyyy}-${mm}-01`
      })(),
      tags: [] as string[],
      lat: null as number | null,
      lng: null as number | null,
      ownerName: '',
      ownerPhone: '+91 ',
    }
  })

  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showMapError, setShowMapError] = useState(false)

  useEffect(() => {
    if (!form.town.trim() || form.town.length < 3) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.town)}&countrycodes=in&addressdetails=1&limit=5`)
        const data = await res.json()
        if (data) {
          setSuggestions(data)
        }
      } catch (err) {
        console.error("Autocompletion error:", err)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.town])

  const handleSelectSuggestion = (item: any) => {
    const addr = item.address || {}
    const postcode = addr.postcode || ''
    const locality = addr.suburb || addr.neighbourhood || addr.village || addr.suburb || addr.locality || item.display_name.split(',')[0]
    const districtVal = addr.city_district || addr.district || addr.county || addr.city || ''
    const stateVal = addr.state || ''
    
    setForm(f => ({
      ...f,
      town: locality,
      district: districtVal,
      state: stateVal,
      pin: postcode,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }))
    setShowSuggestions(false)
    setSuggestions([])
  }

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

  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video' }[]>(() => {
    if (initialData) {
      const files: { url: string; type: 'image' | 'video' }[] = []
      if (initialData.imageUrl) files.push({ url: initialData.imageUrl, type: 'image' })
      if (initialData.media && Array.isArray(initialData.media)) {
        initialData.media.forEach(m => {
          if (m.url !== initialData.imageUrl) files.push({ url: m.url, type: m.type })
        })
      }
      return files
    }
    return []
  })
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const currentCount = mediaFiles.length
    if (currentCount >= 6) {
      alert("You can only upload up to 6 files.")
      return
    }
    const filesToUpload = Array.from(files).slice(0, 6 - currentCount)
    if (files.length > filesToUpload.length) {
      alert(`Only ${filesToUpload.length} file(s) will be uploaded to stay within the 6 file limit.`)
    }

    setUploadingMedia(true)
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
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

  const tagOptions = ['Bike parking', 'Car Parking', 'Pet Friendly', 'Couple Friendly', 'WiFi Ready', 'Power Backup', 'Gated', 'CCTV', 'Water 24/7', 'Gym', 'Lift']

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
            {step === 1 ? (initialData ? 'Edit your space' : 'List your space') : step === 2 ? 'Location & Details' : 'Photos & Amenities'}
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

            <F label="Street / flat number (private)">
              <input className={inp} style={inpStyle} placeholder="Flat 4B, Sunrise Apartments, MG Road" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
            </F>
            <F label="Town / locality (shown publicly)">
              <div className="relative">
                <input 
                  className={inp} 
                  style={inpStyle} 
                  placeholder="e.g. Andheri West" 
                  value={form.town} 
                  onChange={e => {
                    setForm(f => ({ ...f, town: e.target.value }))
                    setShowSuggestions(true)
                  }} 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-stone-50 border-b border-stone-100 last:border-0 truncate font-semibold text-stone-700"
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

            <div className="relative mb-2">
              {showMapError && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg z-[150] text-center animate-bounce">
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-rose-600 rotate-45"></div>
                  📍 This is a mandatory step. You have to select the location on the map to continue.
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowMapError(false)
                  setShowMapModal(true)
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                style={{ 
                  background: showMapError ? '#fdf0e8' : '#eaf2ec', 
                  color: showMapError ? '#d4652a' : '#1a3d2b', 
                  border: showMapError ? '1.5px solid #d4652a' : '1.5px solid #1a3d2b' 
                }}
              >
                <span className="text-sm">📍</span>
                <span>Select location on map</span>
              </button>
            </div>

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

            {showMapModal && (
              <LocationPickerModal
                initialLat={form.lat}
                initialLng={form.lng}
                onConfirm={async (latVal, lngVal) => {
                  setForm(f => ({ ...f, lat: latVal, lng: lngVal }))
                  setShowMapError(false)

                  const isManualEmpty = !form.town.trim() || !form.district.trim() || !form.state.trim() || !form.pin.trim()
                  if (isManualEmpty) {
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latVal}&lon=${lngVal}&addressdetails=1`)
                      const data = await res.json()
                      if (data && data.address) {
                        const addr = data.address
                        const postcode = addr.postcode || ''
                        const locality = addr.suburb || addr.neighbourhood || addr.village || addr.locality || ''
                        const districtVal = addr.city_district || addr.district || addr.county || addr.city || ''
                        const stateVal = addr.state || ''
                        
                        setForm(f => ({
                          ...f,
                          town: f.town.trim() ? f.town : locality,
                          district: f.district.trim() ? f.district : districtVal,
                          state: f.state.trim() ? f.state : stateVal,
                          pin: f.pin.trim() ? f.pin : postcode
                        }))
                      }
                    } catch (err) {
                      console.warn("Reverse geocode failed on confirm:", err)
                    }
                  }
                }}
                onClose={() => setShowMapModal(false)}
              />
            )}
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
            {mediaFiles.length === 0 ? (
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
                    <p className="text-xs" style={{ color: '#7a7570' }}>Tap to choose from gallery · up to 6 files</p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 mb-4" style={{ border: '2px dashed #e2ddd8' }}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-bold text-stone-900">Photos & Videos</p>
                  <p className="text-xs font-semibold text-stone-500">{mediaFiles.length}/6 uploaded</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
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
                        onClick={(e) => { e.stopPropagation(); setMediaFiles(prev => prev.filter((_, i) => i !== idx)); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors font-bold z-10"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 6 && (
                    <div
                      onClick={() => mediaInputRef.current?.click()}
                      className="relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
                      style={{ background: '#f7f5f1', border: '2px dashed #e2ddd8' }}
                    >
                      {uploadingMedia ? (
                        <div className="w-5 h-5 border-2 border-[#1a3d2b]/30 border-t-[#1a3d2b] rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
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
            if (step === 2 && (form.lat === null || form.lng === null)) {
              setShowMapError(true)
              return
            }
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

export default CreateScreen
