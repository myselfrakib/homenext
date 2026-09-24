import React, { useState } from 'react'

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
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

export default OnboardingScreen
