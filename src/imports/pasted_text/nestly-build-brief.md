# Build Prompt: "Nestly" — Peer-to-Peer Space Handover Marketplace

> Copy everything below into your AI agent (Antigravity) as the build brief.

---

## 1. Product Concept

Build a mobile-first web app that connects two kinds of users on one unified account type:

- **A person vacating a rented apartment/room/PG/flat** lists it: name, rent, photos/videos, amenities, and exact location (private).
- **A person searching for a place** browses listings, sees an approximate area (not the exact address), and contacts the lister directly via in-app chat to arrange details, viewing, and handover.

There is **no separate "I'm leaving" vs "I'm searching" account type** — every user gets the same four core abilities: browse, create a listing, chat, and manage their profile. The distinction only shows up in what a given user chooses to do (list a space vs. inquire about one).

**Core privacy mechanic:** the exact coordinates and street address are stored but never shown to a browsing user. Instead, the system reverse-geocodes the pin down to **locality/neighbourhood + city + PIN/postal code level** (e.g. "Salt Lake, Kolkata – 700091") and shows that plus an approximate radius on a fuzzed map. The exact address/pin is only revealed once the lister accepts a connection or explicitly shares it inside chat.

---

## 2. Design Direction

Give this a distinctive, warm, editorial feel — **not** a generic real-estate template (no navy-and-white corporate look, no default Bootstrap card grid). Aim for:

- A modern "home & belonging" aesthetic: soft neutral base (warm off-white / stone), one confident accent color (terracotta, deep moss, or muted amber), generous rounded corners, soft layered shadows.
- Distinctive type pairing: a expressive serif or rounded display face for headings, clean grotesk for body/UI.
- Photo-forward listing cards — the image is the hero, not a thumbnail; use aspect-ratio-locked crops, subtle gradient overlays for legibility of price/title.
- Micro-interactions: skeleton loaders while Firebase data streams in, gentle scale/opacity transitions on card tap, a floating "+" create button with a soft shadow that feels tactile.
- Fully responsive, but designed **mobile-first** (this is primarily a phone-in-hand product); desktop should gracefully expand into a wider grid, not just stretch.
- Accessible contrast, large tap targets (min 44px), safe-area padding for iOS notches.

Use the `frontend-design` skill/guidance if your tooling supports it — avoid default component-library looks; make deliberate typography, spacing, and color choices.

---

## 3. Bottom Navigation Bar (persistent, mobile app-style)

Fixed bottom nav, 5 items, active-state indicator (pill background or icon fill + label color change):

| Icon | Label | Destination |
|---|---|---|
| 🏠 Home | Home | Feed of all open listings |
| 🧭 Explore | Explore | Map/filter/search view |
| ➕ (raised center button) | Create | New listing flow |
| 💬 Chat | Chat | Conversations list |
| 👤 Profile | Profile | My account, my listings, settings |

The **Create button** should be visually elevated — a larger circular button that sits slightly above the nav bar line (like Instagram/BeReal create buttons), with a subtle shadow and accent-color fill.

---

## 4. Page-by-Page Spec

### 4.1 Onboarding / Auth
- Phone-number authentication via **Firebase Auth** (OTP flow): enter number → receive OTP → verify → set display name + profile photo.
- No "are you leaving or searching" fork at signup — skip straight into the app after profile setup. (First-time users can see a one-time swipeable intro of 2–3 screens explaining both flows: "List a space you're leaving" / "Find your next place" / "Chat and connect directly.")

### 4.2 Home (Feed)
- Vertical scroll of listing cards (spec below).
- Top filter chips: price range, move-in date, room type, distance.
- Pull-to-refresh, infinite scroll pagination from Realtime Database.
- Skeleton loading cards (matching the real card's layout/proportions) while data streams — never a generic spinner.
- Tapping a card opens the **Listing Detail** page (photos carousel + video, description, amenities, approximate map with a fuzzed radius circle, "Chat with lister" CTA — exact address stays hidden here too).

#### Listing Card — anatomy & behavior

This is the single most-repeated UI element in the app, so it deserves real craft. Structure, top to bottom:

1. **Media area** (top ~60% of card height, full-bleed, rounded top corners matching the card radius):
   - Cover photo, swipeable if the owner has multiple photos (small dot indicator, e.g. "1/8", bottom-right of the image).
   - Top-left overlay chip: status badge — **Available** (accent color, e.g. green-tinted), **Under Discussion** (amber-tinted), only shown on the owner's own "My Listings" view, since sold/rented listings are filtered out of the public feed by default.
   - Top-right overlay: a heart/save icon (filled if favorited), tap-to-toggle with a small bounce animation, no page navigation.
   - If the listing has a video walkthrough, a small "▶ Video" pill overlay in a corner as a signal.
   - Subtle gradient scrim at the bottom of the image so overlaid text/icons stay legible over any photo.

2. **Content area** (padded section below the media):
   - **Rent** — largest, boldest text on the card: "₹18,000/mo" (with deposit shown smaller/secondary if relevant: "+ ₹36,000 deposit").
   - **Title** — one line, truncates with ellipsis: "Sunny 2BHK near Salt Lake Sector V."
   - **Approximate location line** with a small pin icon: "Salt Lake, Kolkata – 700091" — optionally a muted distance chip if the user's location is known: "~2.1 km away."
   - **Quick-fact row** — small icon+label chips, horizontally scrollable if needed: bedroom type (2BHK), furnishing (Semi-furnished), available-from date ("Avail. from 15 Aug").
   - **Amenity glyphs** (optional, compact row of 3–4 icons max: AC, Wifi, Parking, Lift) — rest are visible only on the detail page, keep the card uncluttered.
   - Tiny owner-context footer, low-emphasis: small avatar + "Posted 2 days ago."

3. **Interaction/motion:**
   - Whole card is tappable → Listing Detail; the save-heart and photo-swipe are the only sub-elements that intercept the tap.
   - On tap, a subtle scale-down (press) + fade transition into the detail page rather than an abrupt route swap.
   - Cards use a soft elevated shadow (not a hard border) that deepens slightly on hover (desktop) or press (mobile).
   - Corner radius, spacing, and shadow should match the app's overall rounded, tactile design language described in Section 2 — this card is the template that sets the tone for the whole product.

4. **Card variants:**
   - **Compact/grid card** — used in 2-column grid mode on Explore's list view or on wider desktop layouts; media area becomes a fixed-aspect square/4:5 crop, content area condenses to rent + title + location only.
   - **Owner card** (My Listings) — replaces the save-heart with an overflow "⋮" menu (Edit, Change status, Delete), and adds the small stats row (views · inquiries · saves) beneath the content area.
   - **Empty/placeholder state** — friendly illustration + "No listings match your filters yet" message, styled to sit where cards would normally appear, not just plain centered text.

### 4.3 Explore
- Full-screen Google Map (Google Maps JS API) with clustered pins at the **fuzzed locality level**, not exact addresses.
- Search bar (Google Places Autocomplete) to jump to a city/locality.
- List/Map toggle, same filter chips as Home.
- Tapping a cluster/pin opens a bottom sheet preview → full listing detail.

### 4.4 Create (the "+" flow) — full detail

A guided, full-screen wizard (not a single long form). Persistent top progress bar (5 segments), back arrow, and a "Save & exit" that writes the draft to Realtime DB so nothing is lost. Each step validates before "Continue" activates.

**Step 1 — Basics**
- Space title (free text, e.g. "Sunny 2BHK near Salt Lake Sector V") — short helper text: "Give it a name buyers will remember, not just an address."
- Space type — segmented control / chip select: Studio, 1RK, 1BHK, 2BHK, 3BHK+, PG/Hostel room, Shared room, Independent house.
- If PG/Shared room selected → extra field: "Sharing type" (Single/Double/Triple occupancy).
- Monthly rent (₹) — numeric input with thousands separator as you type.
- Security deposit (₹) — numeric input, plus a toggle "No deposit."
- Maintenance charges (₹/month, optional) — toggle "Included in rent" vs "Extra."
- Available from — date picker (defaults to today, can't be set in the past).
- Minimum lease duration — chip select (Month-to-month, 6 months, 11 months, 1 year+).

**Step 2 — Location**
- Google Places Autocomplete search field ("Start typing your building or street name").
- Full-screen draggable map with a centered pin — pin drop confirms exact `lat/lng`.
- "Use my current location" button (device geolocation, with permission prompt).
- Auto-filled, editable address breakdown after pin drop/search: Flat/House No. & Street, Locality/Area, Landmark (optional), City, District, State, PIN code.
- **Live privacy preview card** right on this step: "Here's what searchers will see →" showing the fuzzed output (e.g. "Salt Lake, Kolkata – 700091, within ~1.2 km") next to the real address, so the owner visibly understands the trade-off before continuing. Small info icon/tooltip: "Your exact address is only shared if you choose to reveal it in chat."

**Step 3 — Media**
- Photo upload grid (min 3, max 15) — tap-to-add tiles, drag-and-drop reordering, long-press or a star icon to set the **cover photo** (the one used on cards).
- Per-photo client-side compression before upload to Firebase Storage; circular progress ring on each thumbnail while uploading; retry button if one fails.
- Optional short video walkthrough (max ~60–90 sec, single file) — shows a video thumbnail with a play icon overlay once uploaded; progress bar with % during upload since videos are larger.
- Gentle nudge copy if fewer than 3 photos: "Listings with 5+ photos and a walkthrough video get noticeably more replies."
- Basic guardrails: block upload if a photo appears to contain a visible door number/nameplate/exact signage — optional stretch feature, otherwise just a copy reminder: "Avoid photographing exact address plaques or mailbox names — keep the surprise for the chat!"

**Step 4 — Details & Amenities**
- Area — numeric input (sq ft), plus floor number and total floors in building ("3rd of 6").
- Furnishing status — chip select: Unfurnished / Semi-furnished / Fully furnished.
  - If furnished → expandable checklist of what's included (bed, wardrobe, geyser, fridge, washing machine, sofa, dining table, curtains).
- Amenities checklist (multi-select icon grid): AC, Wifi-ready, Power backup, Parking (2-wheeler/4-wheeler), Lift, Water 24x7, Security guard/CCTV, Pets allowed, Balcony, Attached bathroom, Kitchen, Gym in building.
- Preferred tenants — chip multi-select: Family, Bachelors, Students, Working professionals, Any.
- House rules — short free-text (optional), e.g. "No smoking indoors, gate closes at 11 PM."
- "Why I'm leaving" note (optional, builds trust) — short free text, e.g. "Relocating for work to Bangalore."
- Description — longer free-text box with a placeholder prompt and live character count.

**Step 5 — Review & Publish**
- Renders the **exact listing card** as it will appear in the Home feed and the full Listing Detail preview, so the owner sees precisely what a searcher sees (photos carousel, fuzzed location, rent, amenities).
- A separate collapsed "Private info (only you can see this)" section confirming exact address and contact visibility settings.
- Final toggle: listing visibility — Publish now vs. Save as draft.
- Primary CTA: "Publish listing" — on success, a celebratory micro-animation (subtle confetti/checkmark) and redirect to the new listing's detail page with a share sheet ("Share this listing").

**Ongoing management (post-publish, surfaced in Profile → My Listings)**
- Owner-controlled status toggle: **Available / Under Discussion / Rented-Out** — changing status updates the badge everywhere the card appears and removes it from active search once "Rented-Out."
- Edit any field post-publish (photos, rent, status) without restarting the wizard.
- Simple analytics on the listing: view count, number of chat inquiries, saved/favorited count — small stat row on the owner's own listing card.
- Auto-expiry nudge: after a set period (e.g. 30 days) still marked "Available," prompt the owner to confirm it's still open or auto-archive it.

### 4.5 Chat
- Conversation list: avatar, name, listing thumbnail context ("re: Sunny 2BHK in Salt Lake"), last message preview, timestamp, unread badge.
- 1:1 real-time chat thread (Firebase Realtime Database) tied to a specific listing — this keeps context clear when a user is discussing multiple properties.
- In-chat actions: "Share exact location" button (owner-only — explicitly reveals the precise pin/address once they're comfortable), "Schedule a visit," image sharing, read receipts, typing indicator, online/last-seen status.
- Optionally: a lightweight "connection request" step before full chat unlocks, to cut down spam (searcher taps "Interested" → owner accepts → chat opens).

### 4.6 Profile
- Avatar, name, phone (masked, e.g. +91 98••••210), bio.
- **My Listings** tab — cards with status badges (Available/Under Discussion/Rented), edit/delete, view count, inquiry count.
- **Saved/Favorited** listings tab.
- Settings: notification preferences, logout, delete account, privacy info explaining the location-fuzzing feature to build trust.

---

## 5. Privacy / Location-Fuzzing Logic (core differentiator — implement carefully)

1. When a lister drops a pin or types a full address, use the **Google Geocoding API** to resolve it to structured components (locality/sublocality, city, administrative area, postal code).
2. Store two representations in Firestore/Realtime DB:
   - `exactLocation`: `{ lat, lng, formattedAddress }` — readable only by the owning user and by chat participants the owner explicitly grants access to.
   - `approxLocation`: `{ locality, city, postalCode, displayRadius }` — this is what's shown publicly on cards, maps, and listing details.
3. On the map (Explore/Listing Detail), render a **translucent radius circle** (e.g. 800m–1.5km depending on density) centered on a *jittered* point near the real one — never plot the literal exact pin publicly.
4. Add a Firestore/Realtime DB **security rule** enforcing this server-side (not just hidden in the UI) — a searching user's client should never receive the exact coordinates field at all until an explicit "reveal" event is written by the owner.

---

## 6. Tech Stack & Architecture

- **Frontend:** React + TypeScript + Vite, mobile-first responsive layout (Tailwind recommended for speed, but with the custom design tokens above — not default Tailwind look).
- **Backend/DB:** Firebase Realtime Database (chat, presence, live listing status) + Firestore (structured listing data, users, favorites) — use Realtime DB specifically for chat/typing/presence where low-latency sync matters, Firestore for richer querying (filters, pagination).
- **Auth:** Firebase Authentication, phone number (OTP) provider.
- **Storage:** Firebase Storage for photos/videos, with client-side image compression before upload.
- **Location:** Google Maps JavaScript API, Places Autocomplete API, Geocoding API.
- **Hosting/Deploy:** Firebase Hosting.
- **State management:** React Context or Zustand — keep it lightweight, this is a small-team/solo build.
- **Notifications (nice-to-have):** Firebase Cloud Messaging for new-message and new-inquiry push notifications.

### Suggested data model (high level)
```
users/{uid}: { name, phone, photoURL, bio, favorites: [listingId] }

listings/{listingId}:
  ownerId, title, type, rent, deposit, availableFrom, amenities[],
  areaSqFt, status, mediaURLs[], coverURL, createdAt,
  approxLocation: { locality, city, postalCode, lat_jittered, lng_jittered, displayRadius },
  exactLocation: { lat, lng, formattedAddress }   // restricted read access

conversations/{conversationId}:
  listingId, participantIds[], lastMessage, lastUpdated

conversations/{conversationId}/messages/{messageId}:
  senderId, text, imageURL?, type (text/image/location-reveal), timestamp, read
```

---

## 7. Nice-to-Have Polish (add if time allows)
- Verified-lister badge (phone-verified checkmark).
- "Similar listings nearby" section on listing detail.
- Empty states with friendly illustration + CTA ("No listings yet — be the first to list your space!").
- Dark mode.
- Report/block user flow for safety.
- Simple review/rating after a successful handover, shown on the lister's profile to build trust over time.

---

## 8. Deliverable Expectations
Produce a polished, production-feeling PWA-ready web app with the visual craft of a modern consumer app (think Airbnb's warmth crossed with a chat-app's immediacy) — not a bare-bones CRUD admin panel. Prioritize the create-listing flow, the fuzzed-map privacy mechanic, and the real-time chat as the three "wow" moments of the product.