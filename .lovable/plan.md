# Deliverable Proofing Board

A minimal, production-ready photo proofing tool for photographers and their clients.

## Core Goal
Photographer creates a session → adds photo URLs → shares client gallery link → clients heart favorites anonymously (no login) → photographer reviews results and exports CSV.

Strict MVP scope. No accounts. No payments. No extra features.

---

## Features

### 1) Public Client Gallery (No Login)
**Route**
- `/gallery/:sessionToken`

**UI**
- Responsive photo grid
- Heart / favorite toggle per photo
- Toggle filter: “Show favorites only”
- Display favorites count (for the current client)

**Anonymous tracking**
- On first visit generate `client_id` UUID
- Store `client_id` in browser localStorage
- Favorites must be stored in database (NOT only localStorage)

---

### 2) Photographer Review Dashboard (Secret Link)
**Route**
- `/review/:reviewToken`

**Dashboard sections**
1. **Most Loved**
   - Photos ranked by total favorites across all clients for this session
2. **By Client Session**
   - List each `client_id` and their total favorites
   - Expand a client to view which photos they favorited
3. **Export CSV**
   - Download favorites data as CSV

---

### 3) Photographer Session Management
**On review dashboard**
- Create new session with name
- Add photos via URL input (paste URLs, one per line)
- Show the shareable client link for each session
- Delete sessions
- Delete photos

---

## Pages & Routes

| Route | Purpose |
|------|---------|
| `/gallery/:sessionToken` | Client-facing gallery page |
| `/review/:reviewToken` | Photographer dashboard + management |

IMPORTANT:
- Client token and review token MUST be separate values (never reuse one token).

---

## Database Schema (Supabase)

### `sessions`
- `id` uuid (pk)
- `name` text (not null)
- `session_token` text (unique, not null)  // used in client gallery URL
- `review_token` text (unique, not null)   // used in photographer review URL
- `created_at` timestamp

### `photos`
- `id` uuid (pk)
- `session_id` uuid (fk -> sessions.id)
- `url` text (not null)
- `created_at` timestamp

### `favorites`
- `id` uuid (pk)
- `session_id` uuid (fk -> sessions.id)
- `photo_id` uuid (fk -> photos.id)
- `client_id` text (not null)
- `created_at` timestamp
- Unique constraint: (`photo_id`, `client_id`) to prevent duplicates

---

## Required Behavior (Non-Negotiable)

- On gallery load:
  - fetch session + photos
  - fetch favorites for the current client_id
  - render hearts correctly

- Heart toggle:
  - if favorite exists -> remove it
  - else -> create favorite

- Review dashboard must show:
  - total favorites per photo (Most Loved)
  - breakdown by client_id (By Client Session)
  - CSV export includes: session name, session id, photo id, url, client_id, created_at

---

## Design
- Minimal clean layout
- White background
- Purple/blue accents for hearts/buttons
- Black text for readability
- Responsive grid
- Single design pass only (no redesign loops)

---

## Tech Stack
- React + TypeScript + Tailwind CSS
- Supabase for database + API
- No authentication system required (token access only)

---

## Strictly Out of Scope
- user accounts / login
- payments
- comments, ratings, chat
- file uploads / storage handling
- watermarking
- multi-tenant or role permissions