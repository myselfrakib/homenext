import { useState, useEffect } from 'react'
import { auth, firestore } from './firebase'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

import {
  Screen,
  PassPlan,
  Listing,
  Conversation,
  CITY_COORDS,
  getOrCreateGuestUser,
  mapDatabaseListing,
} from './types'
import { CONVERSATIONS, MESSAGES } from './mockData'
import BottomNav from './components/BottomNav'

// Individual Screens
import HomeScreen from './screens/HomeScreen'
import ExploreScreen from './screens/ExploreScreen'
import CreateScreen from './screens/CreateScreen'
import { ChatListScreen, ChatDetailScreen } from './screens/ChatScreens'
import ProfileScreen from './screens/ProfileScreen'
import ListingDetailScreen from './screens/ListingDetailScreen'
import PassScreen from './screens/PassScreen'
import AuthScreen from './screens/AuthScreen'
import { AdminAuthScreen, AdminDashboard } from './screens/AdminScreens'
import LegalScreen from './screens/LegalScreen'
import OnboardingScreen from './screens/OnboardingScreen'

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.hash.startsWith('#/admin'))
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('nestly_onboarded') === 'true')
  const [editListingData, setEditListingData] = useState<Listing | null>(null)
  const [screen, setScreen] = useState<Screen>(() => {
    if (window.location.hash.startsWith('#/admin')) return 'admin-auth'
    const saved = sessionStorage.getItem('nestly_current_screen')
    if (saved === 'admin-auth' || saved === 'admin-dashboard') return 'home'
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
    const handleHashChange = () => {
      const adminPath = window.location.hash.startsWith('#/admin')
      setIsAdminRoute(adminPath)
      if (adminPath) {
        setScreen(prev => prev === 'admin-dashboard' ? 'admin-dashboard' : 'admin-auth')
      } else {
        setScreen(prev => (prev === 'admin-auth' || prev === 'admin-dashboard') ? 'home' : prev)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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

  const [tokens, setTokens] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nestly_tokens')
      return saved ? parseInt(saved, 10) : 0
    } catch (e) {
      return 0
    }
  })

  const [visitedListings, setVisitedListings] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nestly_visited_listings')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  const [brokeragePaidListings, setBrokeragePaidListings] = useState<Record<string, { paid: boolean; paidAt?: string; txnId?: string }>>(() => {
    try {
      const saved = localStorage.getItem('nestly_brokerage_paid')
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

  const handleBuyPlan = async (plan: PassPlan) => {
    const addTokens = plan.tokens || plan.views || 6
    const nextTokens = tokens + addTokens
    setTokens(nextTokens)
    try {
      localStorage.setItem('nestly_tokens', nextTokens.toString())
      if (user && !user.isAnonymous) {
        await updateDoc(doc(firestore, 'profiles', user.uid), { tokens: nextTokens })
      }
    } catch (e) {}
  }

  const handleUseToken = async (id: string) => {
    if (tokens <= 0) return false
    const nextTokens = Math.max(0, tokens - 1)
    setTokens(nextTokens)
    const nextUnlocked = { ...unlockedListings, [id]: true }
    setUnlockedListings(nextUnlocked)
    try {
      localStorage.setItem('nestly_tokens', nextTokens.toString())
      localStorage.setItem('nestly_unlocked_listings', JSON.stringify(nextUnlocked))
      if (user && !user.isAnonymous) {
        await updateDoc(doc(firestore, 'profiles', user.uid), {
          tokens: nextTokens,
          unlockedListings: nextUnlocked
        })
      }
    } catch (e) {}
    return true
  }

  const handleMarkVisited = async (id: string) => {
    const nextVisited = { ...visitedListings, [id]: true }
    setVisitedListings(nextVisited)
    try {
      localStorage.setItem('nestly_visited_listings', JSON.stringify(nextVisited))
      if (user && !user.isAnonymous) {
        await updateDoc(doc(firestore, 'profiles', user.uid), {
          visitedListings: nextVisited
        })
      }
    } catch (e) {}
  }

  const handlePayBrokerage = async (id?: string) => {
    const flatKey = id || 'general'
    const nextPaid = {
      ...brokeragePaidListings,
      [flatKey]: {
        paid: true,
        paidAt: new Date().toISOString(),
        txnId: 'BRK-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      }
    }
    const nextVisited = id ? { ...visitedListings, [id]: true } : visitedListings
    setBrokeragePaidListings(nextPaid)
    if (id) setVisitedListings(nextVisited)
    try {
      localStorage.setItem('nestly_brokerage_paid', JSON.stringify(nextPaid))
      if (id) localStorage.setItem('nestly_visited_listings', JSON.stringify(nextVisited))
      if (user && !user.isAnonymous) {
        await updateDoc(doc(firestore, 'profiles', user.uid), {
          brokeragePaidListings: nextPaid,
          ...(id ? { visitedListings: nextVisited } : {})
        })
      }
    } catch (e) {}
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
              const pData = snapshot.data()
              setUserProfile(pData)
              if (typeof pData.tokens === 'number') {
                setTokens(pData.tokens)
                try { localStorage.setItem('nestly_tokens', pData.tokens.toString()) } catch (e) {}
              }
              if (pData.unlockedListings) {
                setUnlockedListings(prev => ({ ...prev, ...pData.unlockedListings }))
              }
              if (pData.visitedListings) {
                setVisitedListings(prev => ({ ...prev, ...pData.visitedListings }))
              }
              if (pData.brokeragePaidListings) {
                setBrokeragePaidListings(prev => ({ ...prev, ...pData.brokeragePaidListings }))
              }
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

    try {
      const listingsCol = collection(firestore, 'listings')
      const qSnap = await getDocs(listingsCol)
      qSnap.forEach(async (docSnap) => {
        const data = docSnap.data()
        if (data.postedByUid === user.uid) {
          await updateDoc(doc(firestore, 'listings', docSnap.id), {
            postedBy: profileData.name,
            postedByAvatar: profileData.avatar
          })
        }
      })
    } catch (err) {
      console.warn("Failed to sync listings avatars:", err)
    }

    try {
      const profilesSnap = await getDocs(collection(firestore, 'profiles'))
      const myListings = listings.filter(l => l.postedByUid === user.uid)
      for (const profileDoc of profilesSnap.docs) {
        const renterUid = profileDoc.id
        if (renterUid === user.uid) continue
        for (const listing of myListings) {
          const convId = `conv_${listing.id}_${renterUid}`
          const convRef = doc(firestore, 'profiles', renterUid, 'conversations', convId)
          const convSnap = await getDoc(convRef)
          if (convSnap.exists()) {
            await updateDoc(convRef, {
              name: profileData.name,
              avatar: profileData.avatar
            })
          }
        }
      }
    } catch (err) {
      console.warn("Failed to sync conversation avatars:", err)
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

  if (!onboarded && !isAdminRoute) return <OnboardingScreen onDone={handleOnboardingDone} />

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

  const isMyListing = (l: Listing) => {
    if (user?.uid && l.postedByUid && l.postedByUid === user.uid) return true
    if (userProfile?.name && userProfile.name !== 'Guest User' && l.postedBy && l.postedBy.toLowerCase().trim() === userProfile.name.toLowerCase().trim()) return true
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem('nestly_my_listing_ids') || '[]')
      if (myIds.includes(l.id)) return true
    } catch (e) {}
    return false
  }

  const activeListings = listings.filter(l => l.status === 'active' || !l.status)
  const homeListings = activeListings.filter(l => !isMyListing(l))
  const myListings = listings.filter(l => isMyListing(l))

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
          <HomeScreen
            listings={homeListings}
            onListingClick={handleListingClick}
            passVouchers={tokens}
            onGoToPass={() => setScreen('pass')}
            myListingsCount={myListings.length}
            onGoToProfile={() => {
              setScreen('profile')
              setNavTab('profile')
            }}
          />
        )}
        {screen === 'explore' && (
          <ExploreScreen listings={activeListings} onListingClick={handleListingClick} />
        )}
        {screen === 'create' && (
          <CreateScreen 
            userProfile={userProfile}
            initialData={editListingData || undefined}
            onClose={() => { 
              setEditListingData(null)
              setScreen('home')
              setNavTab('home') 
            }} 
            onPublish={async (newListingData) => {
              if (editListingData) {
                let coords = [editListingData.lat, editListingData.lng]
                if (newListingData.lat !== undefined && newListingData.lng !== undefined && newListingData.lat !== null && newListingData.lng !== null) {
                  coords = [newListingData.lat, newListingData.lng]
                }
                const updatedListing = {
                  ...newListingData,
                  lat: coords[0],
                  lng: coords[1],
                }
                await updateDoc(doc(firestore, 'listings', editListingData.id), updatedListing)
                setEditListingData(null)
                setScreen('profile')
                setNavTab('profile')
                return
              }

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
              try {
                const prevIds = JSON.parse(localStorage.getItem('nestly_my_listing_ids') || '[]')
                localStorage.setItem('nestly_my_listing_ids', JSON.stringify([...prevIds, newListingDoc.id]))
              } catch (e) {}
              setScreen('profile')
              setNavTab('profile')
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
            passVouchers={tokens}
            hasBrokerService={Object.values(brokeragePaidListings).some(b => b?.paid)}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
            onAuthTrigger={() => setScreen('auth')}
            onListingClick={handleListingClick}
            onCreateClick={() => {
              setEditListingData(null)
              setScreen('create')
            }}
            onEditListing={(l) => {
              setEditListingData(l)
              setScreen('create')
            }}
            onDeleteListing={async (id) => {
              await deleteDoc(doc(firestore, 'listings', id))
            }}
            onToggleListingStatus={async (id, currentStatus) => {
              const nextStatus = currentStatus === 'paused' ? 'active' : 'paused'
              await updateDoc(doc(firestore, 'listings', id), { status: nextStatus })
            }}
            onScreenNav={setScreen}
          />
        )}
        {['terms', 'privacy', 'refund'].includes(screen) && (
          <LegalScreen type={screen as any} onBack={() => setScreen('profile')} />
        )}
        {screen === 'listing-detail' && (
          selectedListing ? (
            <ListingDetailScreen
              listing={selectedListing}
              isUnlocked={isAdmin || Boolean(user?.uid && selectedListing.postedByUid && selectedListing.postedByUid === user.uid) || !!unlockedListings[selectedListing.id]}
              onUnlock={handleUnlockListing}
              passVouchers={tokens}
              hasBrokerService={!!brokeragePaidListings[selectedListing.id]?.paid}
              visited={!!visitedListings[selectedListing.id]}
              brokeragePaid={!!brokeragePaidListings[selectedListing.id]?.paid}
              onMarkVisited={handleMarkVisited}
              onPayBrokerage={handlePayBrokerage}
              onGoToPass={() => setScreen('pass')}
              onUseVoucher={handleUseToken}
              onBookBroker={async () => { await handlePayBrokerage(selectedListing.id) }}
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
        {(screen === 'pass' || screen === 'premium') && (
          <PassScreen
            passVouchers={tokens}
            hasBrokerService={Object.values(brokeragePaidListings).some(b => b?.paid)}
            onBack={() => setScreen(navTab)}
            onBuyPass={handleBuyPlan}
            onBookBroker={async () => { await handlePayBrokerage() }}
            unlockedListings={unlockedListings}
            visitedListings={visitedListings}
            brokeragePaidListings={brokeragePaidListings}
            listings={listings}
            onMarkVisited={handleMarkVisited}
            onPayBrokerage={handlePayBrokerage}
            onListingClick={handleListingClick}
            onViewListing={() => {
              if (selectedListing) {
                setScreen('listing-detail')
              } else {
                setScreen('home')
              }
            }}
          />
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
              setEditListingData(null)
              setScreen('create')
              setNavTab('home')
            }
          }}
        />
      )}
    </div>
  )
}
