# Bookmark Dashboard - Frontend Product Requirements Document

## 1. Product Overview

- The Dashboard related files and folder will be ("dashboard") folder.
- It will be a react project [intalise with create react app command].
- Please ensure that it is a stand alone.Website And you are not importing any component from the other folders Out of the dashboard folder.

### 1.1 Purpose
A web-based dashboard that serves as the central hub for managing bookmarks saved through the Chrome extension. It provides advanced organization, AI-powered chat functionality, and comprehensive bookmark management capabilities.

### 1.2 Target Users
- Existing Chrome extension users who need better bookmark organization
- Users who want to interact with their saved bookmarks through AI
- Users seeking advanced bookmark management and search capabilities

### 1.3 Key Value Propositions
- Visual organization of all saved bookmarks
- AI-powered insights and chat functionality
- Collection-based categorization system
- Semantic search across all saved content

---

## 2. Core Features & User Stories

### 2.1 Dashboard Overview
**As a user, I want to see all my saved bookmarks in an organized grid layout so that I can quickly browse through my saved content.**

- Display all bookmarks as cards in a responsive grid layout
- Show essential information on each card: title, note, save date
- Support both desktop and mobile responsive design
- Implement infinite scroll or pagination for large datasets

### 2.2 Sidebar Navigation
**As a user, I want a clean navigation sidebar so that I can access different features without cluttering the main interface.**

#### Navigation Items:
- **User Profile**: Access to account settings and user information
- **AI Chat**: Toggle to expand sidebar into chat interface
- **Collections**: Navigate to collections management view

#### Behavior:
- Sidebar remains collapsed by default showing only icons
- Only expands when AI Chat is activated
- Navigation items change the main content area

### 2.3 Memory Card System
**As a user, I want to interact with my bookmarks through intuitive cards so that I can quickly access and manage my saved content.**

#### Card Display (Grid View):
- **Title**: Bookmark title (auto-generated or user-provided)
- **Note**: Personal micro-note attached to bookmark
- **Date**: When the memory was saved
- **Visual Preview**: Embedded site preview/favicon

#### Card Expansion (Modal):
- Click any card to open as modal overlay
- Large embedded preview of the saved site
- Full title and note displayed prominently
- CRUD operations: Edit, Delete options
- Close modal to return to grid view

### 2.4 Collections Management
**As a user, I want to organize my bookmarks into collections so that I can categorize and manage related content together.**

#### Collection Features:
- Create new collections with custom names
- Assign bookmarks to collections (flat structure, no nesting)
- View all bookmarks within a specific collection
- CRUD operations on collections (Create, Read, Update, Delete)

#### Collection Navigation:
- Quick access to collections via sidebar
-  Sidebar only there would be  There will be a logout button.
- Filter dashboard view by collection
- Collection-specific views showing only relevant bookmarks

### 2.5 Search Functionality
**As a user, I want powerful search capabilities so that I can quickly find specific bookmarks using natural language.**

#### Search Bar Features:
- Prominent search bar at the top of the dashboard
- Semantic search across titles, notes, and content
- Collection dropdown integrated into search bar

#### Collection-Filtered Search:
- Dropdown in search bar to select specific collection
- Search results filtered to selected collection only
- "@" notation support for collection references in search queries

### 2.6 AI Chat Interface
**As a user, I want to chat with AI about my bookmarks so that I can get insights, find content, and interact with my saved data conversationally.**

#### Chat Activation:
- Click AI Chat icon in sidebar to expand sidebar into chat panel
- Chat panel becomes the primary interface when active
- Main content area remains visible alongside chat

#### Chat Functionality:
- AI has access to all user bookmarks by default
- Natural language queries about saved content
- Get recommendations and insights based on saved bookmarks
- Find specific bookmarks through conversational interface
- Chat is not persistent (resets each session)

---

## 3. Technical Requirements

### 3.1 Responsive Design
- **Desktop**: Optimized for screens 1024px and above
- **Tablet**: Responsive behavior for 768px to 1023px
- **Mobile**: Mobile-first approach for screens below 768px
- Grid layout adapts to screen size (4 columns desktop, 2 tablet, 1 mobile)

### 3.2 Data Integration
- **Sync Method**: Refresh-based sync with Chrome extension data
- **API Integration**: Consume existing backend APIs for all data operations
- **Real-time Updates**: Manual refresh required to sync latest data

### 3.3 Performance Requirements
- Initial page load under 3 seconds
- Smooth card interactions and modal animations
- Efficient handling of large bookmark datasets
- Lazy loading for embedded content previews

### 3.4 Authentication
- **OAuth Integration**: Using Supabase OAuth authentication screen. Only google Oauth2 screen aloowed for loging. Use only supabase inbuilt functions manage the authentication and refresh logic. Refr to Supabase Documentation [internet search]. 
- **Token Management**: Bearer token authentication for API requests
- **API Request Pattern**:
```javascript
const response = await fetch(`${API_BASE_URL}/auth/status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    }
});
```

---

## 4. User Interface Specifications

### 4.1 Design System
#### Neomorphism Design Approach
- **Core Style**: Extremely minimalist neomorphic design
- **Soft Shadows**: Subtle inset and outset shadows for depth
- **Blur Effects**: Gentle blur effects on interactive elements
- **Clean Typography**: Minimal, readable font choices

#### Color Palette
- **Background**: Neutral neomorphic base (light greys/whites)
- **Cards**: Colorful palette to prevent monotony
  - Dynamic color assignment from predefined palette
  - Each bookmark card gets a unique color from the palette
  - Colors rotate through palette to maintain visual interest
- **Buttons**: Neomorphic style with soft shadows and subtle hover effects
- **Interactive Elements**: Consistent shadow and blur treatments

#### Button Specifications
- **Default State**: Soft outset shadow creating raised appearance
- **Hover State**: Subtle shadow increase and slight blur effect
- **Active/Pressed State**: Inset shadow for pressed appearance
- **Disabled State**: Reduced opacity with flattened shadows

### 4.2 Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ Header: Search Bar + Collection Dropdown           │
├─────┬───────────────────────────────────────────────┤
│ S   │ Main Content Area                           │
│ i   │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│ d   │ │Card │ │Card │ │Card │ │Card │             │
│ e   │ └─────┘ └─────┘ └─────┘ └─────┘             │
│ b   │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│ a   │ │Card │ │Card │ │Card │ │Card │             │
│ r   │ └─────┘ └─────┘ └─────┘ └─────┘             │
└─────┴───────────────────────────────────────────────┘
```

### 4.3 Sidebar States
#### Collapsed State (Default):
- Width: 80px
- Icons only for navigation items
- Hover effects for better UX

#### Expanded State (AI Chat Active):
- Width: 350px
- Chat interface replaces sidebar content
- Close button to return to collapsed state

### 4.4 Modal Specifications
#### Memory Card Modal:
- Centered overlay with backdrop blur
- Responsive sizing (90% viewport on mobile, fixed width on desktop)
- Close on backdrop click or ESC key
- Embedded content with fallback handling

#### Card Design
- **Neomorphic Treatment**: Soft shadows and subtle depth
- **Colorful Backgrounds**: Each card assigned a color from predefined palette
- **Rounded Corners**: Consistent border radius for modern look
- **Content Hierarchy**: Clear visual hierarchy for title, note, and metadata
- **Hover Effects**: Subtle shadow enhancement and slight elevation

#### Modal Design
- **Neomorphic Container**: Large neomorphic card design for modal
- **Backdrop**: Soft blur effect on background content
- **Color Consistency**: Modal inherits color theme from parent card
- **Interactive Elements**: All buttons and controls follow neomorphic design patterns

---

## 5. Backend API Integration

### 5.1 API Request Standards
All API requests follow this pattern:
```javascript
const response = await fetch(`${API_BASE_URL}/endpoint`, {
    method: 'METHOD',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data) // for POST/PUT requests
});
```

### 5.2 API Endpoints Documentation

Note: All authenticated endpoints require `Authorization: Bearer <access_token>`. Public endpoints: `/health`, `/health/detailed`, `/quotes/*`, `/auth/*`.

#### Health
- GET `/health`
  - Auth: No
  - Response 200 JSON:
    ```json
    {
      "status": "healthy",
      "timestamp": "2024-06-01T12:34:56.789012",
      "service": "HippoCampus API"
    }
    ```
- GET `/health/detailed`
  - Auth: No
  - Response 200 JSON:
    ```json
    {
      "status": "healthy | degraded | unhealthy",
      "timestamp": "2024-06-01T12:34:56.789012",
      "services": {
        "database": { "status": "healthy", "details": {} },
        "vector_db": { "status": "healthy", "details": {} }
      }
    }
    ```

#### Authentication
- GET `/auth/status`
  - Auth: No (reads cookies or Authorization header if present)
  - Headers (optional): `Authorization: Bearer <access_token>`
  - Cookies (optional): `access_token`, `refresh_token`
  - Response 200 JSON:
    ```json
    {
      "has_access_token": true,
      "has_refresh_token": false,
      "is_authenticated": true,
      "user_id": "<uuid>",
      "token_valid": true,
      "user_email": "user@example.com",
      "user_name": "Jane Doe",
      "full_name": "Jane Doe",
      "user_picture": "https://...",
      "picture": "https://...",
      "token_expires": 1717267200
    }
    ```
    - On invalid token, `token_valid` is false and `token_error` may be present.

#### Quotes
- GET `/quotes/`
  - Auth: No
  - Response 200 JSON: array of strings
    ```json
    [
      "Focus on being productive instead of busy.",
      "The future depends on what you do today."
    ]
    ```

#### Links (Bookmarks)
- POST `/links/save`  (rate limit: 10/min)
  - Auth: Yes
  - Headers: `Content-Type: application/json`
  - Body JSON:
    ```json
    {
      "title": "Article title",
      "note": "My note @collection-name",
      "link": "https://example.com/post"
    }
    ```
  - Response 200 JSON:
    ```json
    { "status": "saved", "doc_id": "<userId>-YYYY-DD-MM#HH-MM-SS" }
    ```

- POST `/links/search`  (rate limit: 15/min)
  - Auth: Yes
  - Headers: `Content-Type: application/json`
  - Body JSON:
    ```json
    {
      "query": "vector databases @ai",
      "filter": { "collection": { "$eq": "ai" } }
    }
    ```
  - Response 200 JSON: array of result objects
    ```json
    [
      {
        "id": "<doc_id>",
        "page_content": "Title: ...\nNote: ...\nSource: https://...",
        "metadata": {
          "doc_id": "<doc_id>",
          "user_id": "<uuid>",
          "namespace": "<uuid>",
          "title": "...",
          "note": "original note",
          "source_url": "https://...",
          "site_name": "Example",
          "type": "Bookmark",
          "date": "2024-06-01T12:34:56.789012",
          "collection": "ai"
        }
      }
    ]
    ```

- DELETE `/links/delete`  (rate limit: 15/min)
  - Auth: Yes
  - Query params: `doc_id_pincone=<doc_id>`
  - Response 200 JSON:
    ```json
    {
      "status": "success",
      "message": "Document deleted successfully",
      "doc_id": "<doc_id>",
      "vector_result": {},
      "db_result": { "status": "deleted", "doc_id": "<doc_id>", "deleted_count": 1 }
    }
    ```

- GET `/links/get`  (rate limit: 20/min)
  - Auth: Yes
  - Response 200 JSON: array of bookmarks
    ```json
    [
      {
        "id": "<db_id>",
        "doc_id": "<doc_id>",
        "user_id": "<uuid>",
        "title": "...",
        "type": "Bookmark",
        "note": "...",
        "source_url": "https://...",
        "site_name": "Example",
        "date": "2024-06-01T12:34:56.789012",
        "collection": "ai"
      }
    ]
    ```

#### Notes
- GET `/notes/`  (rate limit: 20/min)
  - Auth: Yes
  - Response 200 JSON: array of notes
    ```json
    [
      {
        "id": "<db_id>",
        "doc_id": "<doc_id>",
        "user_id": "<uuid>",
        "type": "Note",
        "title": "...",
        "note": "...",
        "date": "2024-06-01T12:34:56.789012",
        "collection": "general"
      }
    ]
    ```

- POST `/notes/`  (rate limit: 15/min)
  - Auth: Yes
  - Headers: `Content-Type: application/json`
  - Body JSON:
    ```json
    {
      "title": "My note title",
      "note": "Freeform note text @collection",
      "collection": "optional-collection-name"
    }
    ```
  - Response 200 JSON:
    ```json
    { "status": "saved", "doc_id": "<userId>-YYYY-DD-MM#HH-MM-SS" }
    ```

- PUT `/notes/{note_id}`  (rate limit: 15/min)
  - Auth: Yes
  - Headers: `Content-Type: application/json`
  - Body JSON: arbitrary fields to update
    ```json
    { "title": "Updated title", "note": "Updated note" }
    ```
  - Response 200 JSON:
    ```json
    { "title": "Updated title", "note": "Updated note", "id": "{note_id}", "user_id": "<uuid>" }
    ```

- POST `/notes/search`  (rate limit: 15/min)
  - Auth: Yes
  - Query params: `query=<search text>`; optional `filter=<JSON object>`
  - Response 200 JSON: array of result objects (same shape as `/links/search`, `type` may be `Note`).

- DELETE `/notes/{note_id}`  (rate limit: 15/min)
  - Auth: Yes
  - Response 200 JSON:
    ```json
    {
      "status": "success",
      "message": "Note deleted successfully",
      "doc_id": "{note_id}",
      "vector_result": {},
      "db_result": { "status": "deleted" }
    }
    ```

#### Collections
- GET `/collections/`  (rate limit: 30/min)
  - Auth: Yes
  - Response 200 JSON: array of collections with counts
    ```json
    [
      { "name": "ai", "memory_count": 5 },
      { "name": "books", "memory_count": 12 }
    ]
    ```

### 5.3 API Response Formats
*[Response schemas and data structures to be provided]*

---

## 6. User Workflows

### 6.1 Primary User Journey
1. User opens dashboard and sees grid of all saved bookmarks
2. User can search for specific content using the search bar
3. User can filter by collection using dropdown
4. User clicks on bookmark card to view full details in modal
5. User can edit/delete bookmarks from modal view

### 6.2 Collection Management Workflow
1. User navigates to Collections via sidebar
2. User creates new collection or selects existing one
3. User assigns bookmarks to collections
4. User can view collection-specific bookmark grids
5. User manages collections (rename, delete, etc.)

### 6.3 AI Chat Workflow
1. User clicks AI Chat icon in sidebar
2. Sidebar expands to show chat interface
3. User asks questions about their bookmarks
4. AI provides contextual responses based on saved data
5. User can continue conversation or close chat panel

---

## 7. Success Metrics

### 7.1 User Engagement
- Average session duration on dashboard
- Number of bookmarks organized into collections
- AI chat usage frequency and session length

### 7.2 Feature Adoption
- Percentage of users creating collections
- Search feature usage rates
- Modal engagement (time spent viewing expanded cards)

### 7.3 Performance Metrics
- Page load times across different devices
- Search response times
- Modal opening/closing animation smoothness

---

## 8. Development Priorities

### 8.1 Phase 1 (MVP)
- OAuth authentication integration with Supabase
- Basic dashboard with neomorphic bookmark grid
- Colorful card system with palette rotation
- Sidebar navigation with neomorphic design
- Memory card modal functionality

### 8.2 Phase 2
- Collections management with neomorphic UI
- AI chat integration with expandable sidebar
- Basic search implementation
- CRUD operations for bookmarks

### 8.3 Phase 3
- Advanced search with collection filtering
- Responsive design optimization
- Performance optimizations
- Enhanced neomorphic UI/UX improvements