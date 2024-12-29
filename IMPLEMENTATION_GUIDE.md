# SF RATS Implementation Guide

## Phase 1: Core Features (Completed)
1. Basic Map Interface
- ✅ Interactive map with Leaflet
- ✅ Custom markers by category
- ✅ Popup previews
- ✅ Legend

2. Item Listings & Details
- ✅ Listing detail page
- ✅ Share functionality
- ✅ Directions button
- ✅ Sidebar listings view

3. Search & Filters
- ✅ Text search
- ✅ Category filters
- ✅ Date filters (Today/Upcoming Week/Upcoming Month)
- ✅ Custom date range picker

4. Data Integration
- ✅ Basic database schema
- ✅ Event scrapers
  - ✅ Museum free days
  - ✅ Eventbrite free events
- ✅ Manual submission form

## Phase 2: User System & Listing Management (Next)

### Anonymous Posting System
1. Database Updates
```sql
ALTER TABLE free_items ADD COLUMN:
- edit_code VARCHAR(10)
- status VARCHAR(20) DEFAULT 'available'
- posted_by VARCHAR(100)
- is_anonymous BOOLEAN DEFAULT true
```

2. Anonymous Posting Flow
- Generate random edit_code on post
- Return edit_code to user
- Store hashed edit_code in database
- Simple nickname entry

3. Edit Code System
- Validate edit_code for modifications
- Allow status updates
- Allow deletion
- Store edit_code securely

### Google Authentication
1. Setup
- Implement Google OAuth
- User session management
- Secure routes

2. Database Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE free_items
  ADD COLUMN user_id INTEGER REFERENCES users(id);
```

3. User Features
- Profile dashboard
- Listing management
- Post history

### Listing Status System
1. Status Types
- Available (default, green)
- Claimed (yellow)
- Gone (gray)

2. Frontend Components
- Status indicators
- Status toggle buttons
- Conditional rendering

3. API Endpoints
```typescript
PUT /api/items/:id/status
DELETE /api/items/:id
```

## Phase 3: Comments System

### Database Schema
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES free_items(id),
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  anonymous_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Features
1. Basic Commenting
- Post as anonymous or logged-in
- Show user name or anonymous nickname
- Timestamps
- Text-only comments

2. Frontend Components
- CommentList
- CommentForm
- CommentItem

3. API Endpoints
```typescript
GET /api/items/:id/comments
POST /api/items/:id/comments
DELETE /api/items/:id/comments/:commentId
```

## Phase 4: Advanced Features
1. Real-time Updates
2. Image Uploads
3. Notifications
4. Analytics Dashboard

## Security Considerations
1. Rate Limiting
2. Input Validation
3. XSS Prevention
4. CSRF Protection
5. Secure Session Management 