# SF RATS Implementation Guide

## Project Overview
Free stuff and events aggregator for San Francisco, focusing on community-driven content.

## Core Features

### 1. Event Discovery
- Map-based interface
- Category filters
- Date/time filters
- Search functionality
- List/Grid view option

### 2. User-Generated Content
- Event submission form
  - Title and description
  - Categories: Food, Events, Items, Services
  - Location input options:
    - Map picker (interactive)
    - Address input (autocomplete)
    - "Use my location" button
  - Google Maps/Apple Maps integration:
    - Generate shareable location links
    - Direct navigation links
  - Date/time selector
  - Optional photo upload
  - Description formatting

### 3. User System
- Email/password authentication
- Profile pages
  - User's submitted events
  - Saved events
  - Activity history
- Reputation system
  - Verified email badge
  - Active contributor badge
  - Reliability score

### 4. Community Features
- Event interactions
  - "Interested" counter
  - Save/bookmark
  - Share functionality
- Comments/Questions
- Report inappropriate content
- Follow other users

## Technical Architecture

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   ├── Events/
│   │   │   ├── EventForm.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── EventList.tsx
│   │   ├── User/
│   │   │   ├── Profile.tsx
│   │   │   ├── Auth/
│   │   │   └── Dashboard.tsx
│   │   └── Common/
│   └── hooks/
       ├── useAuth.ts
       ├── useEvents.ts
       └── useFilters.ts
```

### Backend (Node + Express + PostgreSQL)
```
backend/
├── src/
│   ├── routes/
│   │   ├── events.ts
│   │   ├── users.ts
│   │   └── auth.ts
│   ├── services/
│   │   ├��─ scrapers/
│   │   └── validation/
│   └── db/
       ├── schema.sql
       └── migrations/
```

### Database Schema
```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events/Items
CREATE TABLE free_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  location_place_id TEXT,
  maps_url TEXT,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  category item_category,
  verified BOOLEAN DEFAULT false,
  interest_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Interactions
CREATE TABLE user_interactions (
  user_id INTEGER REFERENCES users(id),
  item_id INTEGER REFERENCES free_items(id),
  type VARCHAR(50), -- 'interested', 'saved', 'reported'
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id, type)
);
```

## Implementation Phases

### Phase 1: Core Features (Current)
- ✅ Basic map interface
- ✅ Event markers
- ✅ Category filters
- ✅ Date filters
- ✅ Search functionality

### Phase 2: User System (Next)
- User registration/login
- Profile pages
- Event submission form
- Basic moderation tools

### Phase 3: Community Features
- Event interactions
- User reputation system
- Comments/messaging
- Social sharing

### Phase 4: Enhancement
- Image upload
- Advanced search
- Email notifications
- Mobile optimization

## Deployment Strategy
- Frontend: GitHub Pages or Netlify (free tier)
- Backend: Railway or Render (free tier)
- Database: Supabase or Neon (free tier)
- Media Storage: Cloudinary (free tier)

## Quality Control
- Input validation
- Rate limiting
- reCAPTCHA integration
- Content moderation queue
- User reporting system

## Future Considerations
- Mobile app version
- Event reminders
- API for third-party integrations
- Analytics dashboard
- Community moderators 

### Location Features Implementation
```typescript
// Utility function to generate map links
export const generateMapLinks = (lat: number, lng: number, address: string) => {
  return {
    // Google Maps
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    
    // Apple Maps (universal link)
    apple: `maps://?q=${address}&ll=${lat},${lng}`,
    
    // General purpose (opens in default map app)
    universal: `geo:${lat},${lng}?q=${encodeURIComponent(address)}`
  }
}

// Component for location display
interface LocationButtonsProps {
  lat: number
  lng: number
  address: string
}

function LocationButtons({ lat, lng, address }: LocationButtonsProps) {
  const links = generateMapLinks(lat, lng, address)
  
  return (
    <div className="flex gap-2">
      <a 
        href={links.google}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm"
      >
        Open in Google Maps
      </a>
      <a 
        href={links.apple}
        className="btn btn-sm"
      >
        Open in Apple Maps
      </a>
    </div>
  )
} 