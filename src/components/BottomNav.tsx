import React from 'react'
import { HomeIcon, ExploreIcon, PlusIcon, ChatIcon, ProfileIcon } from './Icons'

export function BottomNav({
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

export default BottomNav
