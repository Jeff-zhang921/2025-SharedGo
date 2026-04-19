# SharedGo Backend API

**Base URL:** `http://localhost:3000`

This section documents the endpoints used by **Frontend**

- Event tab: **Get info**, **join**, **review**
- Host tabs: **Upcoming**, **Past events**, **Overview**, **Reviews**

---

## Table of Contents

- [0. Authentication](#0-authentication)
  - [0.1 Start Email Login](#01-start-email-login)
  - [0.2 Verify Email Code](#02-verify-email-code)
  - [0.3 Current User](#03-current-user)
  - [0.4 Send Participant List Email](#04-send-participant-list-email)
  - [0.5 Logout](#05-logout)
- [1. Event Endpoints](#1-event-endpoints)
  - [1.0 List Events (Nearby / All)](#10-list-events-nearby--all)
  - [1.1 Create Event](#11-create-event)
  - [1.2 Get Event Details](#12-get-event-details)
  - [1.3 Join Event](#13-join-event)
  - [1.4 Create Review for Event](#14-create-review-for-event)
  - [1.5 Update Event (Host Only)](#15-update-event-host-only)
  - [1.6 Delete Event (Host Only)](#16-delete-event-host-only)
- [2. Host Endpoints (Tabs)](#2-host-endpoints-tabs)
  - [2.1 Host Overview](#21-host-overview)
  - [2.2 Host Events (Upcoming / Past / All)](#22-host-events-upcoming--past--all)
  - [2.3 Host Reviews (Paginated)](#23-host-reviews-paginated)
- [3. Home Endpoints](#3-home-endpoints)
  - [3.1 Home dashboard](#31-home-dashboard-feed)
  - [3.2 List All Categories](#32-list-all-categories)
  - [3.3 Events by Category](#33-events-by-category)
  - [3.4 Upcoming Events](#34-upcoming-events) 
- [4. Profile Endpoints (Me)](#4-profile-endpoints-me)
  - [4.1 Current Profile](#41-current-profile)
  - [4.2 Update Profile](#42-update-profile)
  - [4.3 Profile Overview](#43-profile-overview)
  - [4.4 My Events (Paginated)](#44-my-events-paginated)
  - [4.5 My Reviews (Paginated)](#45-my-reviews-paginated)
- [5. Filter Endpoints](#5-filter-endpoints)
  - [5.1 Nearby Events](#51-nearby-events)
  - [5.2 Search Events (Combined Filters)](#52-search-events-combined-filters)
  - [5.3 Name Search (Hosts/Users)](#53-name-search-hostsusers)
- [6. Chat (REST + Socket)](#6-chat-rest--socket)
  - [6.1 Create Or Find Thread](#61-create-or-find-thread)
  - [6.2 List My Threads](#62-list-my-threads)
  - [6.3 Search Users (Conversation Search)](#63-search-users-conversation-search)
  - [6.4 Thread Messages](#64-thread-messages)
  - [6.5 Upload Chat Media](#65-upload-chat-media)
  - [6.6 Socket Events](#66-socket-events)
  - [6.7 Manual Test Sequence](#67-manual-test-sequence)
- [7. Board Endpoints (General + Q&A)](#7-board-endpoints-general--qa)
  - [7.1 Get General Messages](#71-get-general-messages)
  - [7.2 Post General Message (Host Only)](#72-post-general-message-host-only)
  - [7.3 Get Q&A Messages](#73-get-qa-messages)
  - [7.4 Post Question](#74-post-question)
  - [7.5 Post Answer](#75-post-answer)

---

## 0. Authentication

### 0.1 Start Email Login

**POST** `/auth/email/start`

**Request body (JSON)**

| Field   | Type   | Required | 
|---------|--------|----------|
| `email` | string | yes      |
**Response**

- `{ message: "Verification code sent." }`

---

### 0.2 Verify Email Code

**POST** `/auth/email/verify`

**Request body (JSON)**

| Field   | Type   | Required | Notes                       |
|---------|--------|----------|-----------------------------|
| `email` | string | yes      | Same email used above       |
| `code`  | string | yes      | 6-digit code from email     |

**Response**

- `{ message: "Logged in.", user: { id, email, name } }`

**Notes**

- These endpoints establish a session cookie used for protected POST routes.

---

### 0.3 Current User

**GET** `/auth/me`

**Response**

- `{ user: { id, email, name, provider } }`

**Notes**

- Requires the session cookie set by `/auth/email/verify`.

---

### 0.4 Send Participant List Email

**POST** `/auth/events/:eventId/participants/email`

Send the participant email list for one specific event to the logged-in host.

**URL params**

| Param     | Type   | Required | Notes    |
|-----------|--------|----------|----------|
| `eventId` | number | yes      | Event ID |

**Auth / Rules**

- Requires the session cookie from `/auth/email/verify`.
- Only the organizer of that event can use this route.
- The email is sent to the logged-in organizer's own email address.

**Response**

```json
{
  "message": "Participant list emailed.",
  "recipient": "host@example.com",
  "participantCount": 4
}
```

**Common error responses**

- `400` `{ "message": "Valid event id is required." }`
- `401` `{ "message": "Not authenticated." }`
- `403` `{ "message": "Only the event organizer can email the participant list." }`
- `404` `{ "message": "Event not found." }`
- `500` `{ "message": "Email login is not configured." }`

---

### 0.5 Logout

**POST** `/auth/logout`

Destroys the current session.

**Response**

- `204 No Content`

**Common error responses**

- `500` `{ "message": "Failed to log out." }`

---
## 1. Event Endpoints

All POST endpoints require an authenticated session cookie from /auth/email/verify.

### 1.0 List Events (Nearby / All)

**GET** `/events`

**Query params**

| Param       | Type   | Description |
|-------------|--------|-------------|
| `latitude`  | number | Optional. User latitude. If provided with `longitude`, it is stored in the session. |
| `longitude` | number | Optional. User longitude. If provided with `latitude`, it is stored in the session. |

**Notes**

- You only need to send location once per session. After that, `/events` will reuse the session location.
- If no user location is available, `distance` will be `null` and results are returned in `createdAt` descending order.

**Response**

Returns a list of events. Each item includes:

- Event fields (including `category`, `latitude`, `longitude`)
- Host info
- `attendeeCount`
- `distance` (km) or `null`

---

### 1.1 Create Event

**POST** `/events/create`

Create a new event for a host.

**Request body (JSON)**

| Field         | Type   | Required | Notes                                |
|--------------|--------|----------|--------------------------------------|
| `title`      | string | yes      | Event title                          |
| `startsAt`   | string | yes      | ISO datetime string                  |
| `location`   | string | yes      | Text description of the location     |
| `hostEmail`  | string | no       | Derived from the login session |
| `description`| string | no       | Longer description of the event      |
| `imageUrl`   | string | no       | URL of event image                   |
| `externalUrl`| string | no       | URL for external registration/info   |
| `capacity`   | number | no       | Max attendees; `null` = no limit     |
| `category`   | string | no       | Must be a Category enum value. Defaults to `Other`. |
| `latitude`   | number | yes      | Required latitude.                   |
| `longitude`  | number | yes      | Required longitude.                  |

**Response**

Returns the created event, including:

- Event fields
- Host info
- `attendeeCount` (number of participants)
- `category`, `latitude`, `longitude`

---

### 1.2 Get Event Details

**GET** `/events/:id`

**URL params**

| Param | Type   | Required | Notes    |
|-------|--------|----------|----------|
| `id`  | number | yes      | Event ID |

**Response**

Includes:

- Event fields
- Host info
- `category`, `latitude`, `longitude`
- `attendees`: list of `{ id, name, email, joinedAt }`
- `attendeeCount`
- `seatsRemaining` (if capacity set)
- `averageRating`
- `reviews`: list of  
  `{ id, rating, comment, createdAt, author: { id, name, email } }`

---

### 1.3 Join Event

**POST** `/events/:id/join`

**URL params**

| Param | Type   | Required |
|-------|--------|----------|
| `id`  | number | yes      |

**Request body (JSON)**

| Field   | Type   | Required | Notes                    |
|---------|--------|----------|--------------------------|
| `email` | string | no       | Derived from the login session |
| `name`  | string | no       | Attendee display name    |

**Behavior**

- If user is already joined: returns existing/consistent join.
- If event is full (capacity reached): returns capacity-full error.

**Response**

- Joined attendee: `{ id, name, email, joinedAt }`

**Leave Event**

**DELETE** `/events/:id/join`

**Request body (JSON)**

| Field   | Type   | Required | Notes |
|---------|--------|----------|-------|
| `email` | string | yes      | Email of the attendee leaving the event |

**Response**

- `{ message: "Left the event successfully." }`
- If the user was not joined: `{ message: "You have not joined this event." }`

---

### 1.4 Create Review for Event

**POST** `/events/:id/reviews`

**URL params**

| Param | Type   | Required |
|-------|--------|----------|
| `id`  | number | yes      |

**Request body (JSON)**

| Field     | Type   | Required | Notes                               |
|-----------|--------|----------|-------------------------------------|
| `email`   | string | no       | Derived from the login session |
| `rating`  | number | no       | 1–5; optional rating                |
| `comment` | string | no       | Optional text comment               |

**Rules**

- The user must **have joined** the event.
- The event must have **already started**.

**Response**

- Saved review with:
  - `id`, `rating`, `comment`, `createdAt`
  - `author` summary
  - `event` summary

---
### 1.5 Update Event (Host Only)

**PATCH** `/events/:id`

**Auth**: Requires session cookie. Only the host can update their own event.

**Request body (JSON)** — any of the following fields:

| Field        | Type              | Notes |
|--------------|-------------------|-------|
| `title`      | string            | Optional, non-empty if provided |
| `startsAt`   | string            | Optional ISO datetime |
| `location`   | string            | Optional, non-empty if provided |
| `description`| string \| null     | Optional; empty string becomes null |
| `imageUrl`   | string \| null     | Optional; empty string becomes null |
| `externalUrl`| string \| null     | Optional; empty string becomes null |
| `capacity`   | number \| null     | Optional; null clears capacity |
| `category`   | string            | Optional; must be a Category enum |
| `latitude`   | number            | Optional; must be provided together with `longitude` if updating location |
| `longitude`  | number            | Optional; must be provided together with `latitude` if updating location |

**Response**

- `{ message: "Event updated successfully.", event: { ... } }`

---
### 1.6 Delete Event (Host Only)

**DELETE** `/events/:id`

**Auth**: Requires session cookie. Only the host can delete their own event.

**Response**

- `{ message: "Event deleted successfully." }`

---

## 2. Host Endpoints (Tabs)

These power the **Host** page tabs:

- Upcoming
- Past events
- Overview
- Reviews

---

### 2.1 Host Overview

**GET** `/hosts/:hostId/overview`

**URL params**

| Param    | Type   | Required |
|----------|--------|----------|
| `hostId` | number | yes      |

**Response**

```jsonc
{
  "host": {
    "id": 1,
    "name": "Host Name",
    "email": "host@example.com"
  },
  "stats": {
    "totalEvents": 12,
    "upcomingCount": 3,
    "pastCount": 9,
    "totalAttendees": 120,
    "averageFillRate": 0.75, // or null if no capacity
    "averageRating": 4.5,    // or null if no reviews
    "reviewCount": 18
  },
  "upcomingEvents": [
    {
      "id": 10,
      "title": "Event title",
      "startsAt": "2025-12-21T18:00:00.000Z",
      "capacity": 20,
      "location": "Bristol",
      "attendeeCount": 12,
      "seatsRemaining": 8
    }
  ],
  "pastEvents": [
    {
      "id": 3,
      "title": "Past event",
      "startsAt": "2025-10-01T18:00:00.000Z",
      "capacity": 30,
      "location": "Bristol",
      "attendeeCount": 25,
      "seatsRemaining": 5
    }
  ],
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great event!",
      "createdAt": "2025-11-20T12:00:00.000Z",
      "author": {
        "id": 5,
        "name": "Alice",
        "email": "alice@example.com"
      },
      "event": {
        "id": 3,
        "title": "Past event",
        "startsAt": "2025-10-01T18:00:00.000Z"
      }
    }
  ]
}
```
---
### 2.2 Host Events (Upcoming / Past / All)

**GET** `/hosts/:hostId/events?status=&limit=&page=`

This endpoint powers the **Upcoming** and **Past events** tabs for a host.

**URL params**

| Param    | Type   | Required | Description    |
|----------|--------|----------|----------------|
| `hostId` | number | yes      | ID of the host |

**Query params**

| Param    | Type   | Default     | Description                                                                |
|----------|--------|-------------|----------------------------------------------------------------------------|
| `status` | string | `"upcoming"`| Which events to return: `"upcoming"`, `"past"`, or `"all"`                |
| `limit`  | number | `10`        | How many events per page (maximum `50`)                                   |
| `page`   | number | `1`         | Page number (1-based). Used together with `limit` for pagination          |

**Example requests**

- Upcoming events, first page (10 per page):  
  `GET /hosts/1/events?status=upcoming&limit=10&page=1`

- Past events, second page (20 per page):  
  `GET /hosts/1/events?status=past&limit=20&page=2`

- All events (no status filter), default pagination:  
  `GET /hosts/1/events?status=all`

**Response**

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23
  },
  "events": [
    {
      "id": 10,
      "title": "Event title",
      "startsAt": "2025-11-21T18:00:00.000Z",
      "capacity": 20,
      "location": "Bristol",
      "attendeeCount": 12,
      "seatsRemaining": 8
    }
  ]
}
```

- `total` tells the frontend how many events exist in total for this host and status.
- `attendeeCount` and `seatsRemaining` are computed from participants and capacity.

---

### 2.3 Host Reviews (Paginated)

**GET** `/hosts/:hostId/reviews?limit=&page=`

This endpoint powers the **Reviews** tab for a host.

**URL params**

| Param    | Type   | Required | Description    |
|----------|--------|----------|----------------|
| `hostId` | number | yes      | ID of the host |

**Query params**

| Param   | Type   | Default | Description                                   |
|---------|--------|---------|-----------------------------------------------|
| `limit` | number | `10`    | How many reviews per page (maximum `50`)      |
| `page`  | number | `1`     | Page number (1-based). Used for pagination    |

**Example requests**

- First page of reviews (10 per page):  
  `GET /hosts/1/reviews?limit=10&page=1`

- Second page of reviews (5 per page):  
  `GET /hosts/1/reviews?limit=5&page=2`

**Response**

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 18
  },
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great event!",
      "createdAt": "2025-11-20T12:00:00.000Z",
      "author": {
        "id": 5,
        "name": "Alice",
        "email": "alice@example.com"
      },
      "event": {
        "id": 3,
        "title": "Past event",
        "startsAt": "2025-10-01T18:00:00.000Z"
      }
    }
  ]
}
```

- `total` is the total number of reviews for this host.

- Each review includes both the `author` and a short `event summary` so the UI can show which event the review belongs to.

## 3. Home Endpoints
This provides search functionality, recommended events, category based filtering and upcoming events.

### 3.1 Home Dashboard
**GET** `/home`

**Query params**

| Param    | Type   | Description  |    
|----------|--------|--------------|
| `search` | string | filter by title, description and location (case-insensitive) |
| `latitude` | number | Optional. User latitude. If provided with `longitude`, it is stored in the session. |
| `longitude` | number | Optional. User longitude. If provided with `latitude`, it is stored in the session. |

**Example requests**
-  search 
  `GET /home/?search=coffee`

- with coordinates of user  
  `GET /home/?latitude=51.4574&longitude=-2.6078`

**Notes**

- You only need to send location once per session. After that, `/home` will reuse the session location.
- `recommendedEvents` uses the logged-in user's most joined past category, then returns the top 5 by attendance within 10 km when location is available. If the user has no past joins (or is not logged in), it returns the top 5 by attendance within 10 km when location is available.
- `upcomingPreview` returns the 5 soonest events within 10 km when location is available; otherwise it returns the 5 soonest overall.

**Response**
```jsonc
{"recommendedEvents":[{
  "id":6,
  "title":"Group Study Session ",
  "description":null,
  "startsAt":"2026-02-20T10:00:00.000Z",
  "category":"Educational",
  "location":"Wills Memorial Building",
  "imageUrl":null,
  "host":{
    "id":1,
    "name":"Bristol Host ",
    "email":""},
    "attendeeCount":0,
    "seatsRemaining":"Unlimited",
    "distance":0.411}
  //next 4 recommended
  ],

  "categories": [
    //categories
  ],
  "upcomingPreview": [
    //Top 5 events starting soonest (within 10 km if location is available)
  ]
}
```
### 3.2 List All Categories 
**GET** `/home/categories`
returns all event categories

**Response** 
```json
{"categories":["Physical_Activities","Festivals","Educational","Networking","Arts_Culture","Food_Drink","Music_Concerts","Tech_Gaming","Wellness_Meditation","Volunteer_Charity","Other"]}
```

### 3.3 Events by Category
**GET** `/home/categories/:categoryName`
returns all future events within a specific category

**URL params**

| Param    | Type   | Required | Description    |
|----------|--------|----------|----------------|
| `categoryName` | string | yes      | Enum value (e.g Networking) |

**Example Request**
  `GET /home/categories/Networking`

**Example Response**
```jsonc
{"events":[{
  "id":1,
  "title":"Tech Networking",
  "description":null,
  "startsAt":"2026-02-18T15:00:00.000Z",
  "category":"Networking",
  "location":"Engine Shed",
  "imageUrl":null,
  "host":{
    "id":1,
    "name":"Bristol Host ",
    "email":""},
    "attendeeCount":0,
    "seatsRemaining":"Unlimited",
    "distance":null}]}
```
### 3.4 Upcoming Events
**GET** `/home/upcoming?page=`
list of all future events with pagination (soonest to latest)
**Query params**
| Param   | Type   | Default | Description                                   |
|---------|--------|---------|-----------------------------------------------|
| `page`  | number | `1`     | Page number for pagination    |
| `latitude` | number | Optional. User latitude. If provided with `longitude`, it is stored in the session. |
| `longitude` | number | Optional. User longitude. If provided with `latitude`, it is stored in the session. |

**Notes**

- If location is available (query or session), results are limited to events within 100 km.
- If no location is available, all upcoming events are returned and `distance` is `null`.

**Example Request**
`/home/upcoming?page=1`

**Response**
```json
{"pagination":{
  "page":1,
  "limit":10,
  "total":7
  },
  "events":[{
    "id":4,
    "title":"Stokes Croft Art Walk ",
    "description":"Explore street art",
    "startsAt":"2026-02-10T13:00:00.000Z",
    "category":"Arts_Culture",
    "location":"Stokes Croft",
    "imageUrl":null,
    "host":{
      "id":1,
      "name":"Bristol Host ",
      "email":""},
      "attendeeCount":0,
      "seatsRemaining":"Unlimited",
      "distance":null}],
}
```

## 4. Profile Endpoints (Me)
These endpoints power the **Profile / Me** page.
All require the session cookie from `/auth/email/verify`.

### 4.1 Current Profile
**GET** `/profile/me`

**Response**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

---

### 4.2 Update Profile
**PATCH** `/profile/me`

**Request body (JSON)**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string \| null | yes | Trimmed; empty string becomes null |

**Response**
```json
{
  "message": "Profile updated.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "New Name"
  }
}
```

---

### 4.3 Profile Overview
**GET** `/profile/me/overview`

**Response**
```jsonc
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "stats": {
    "upcomingCount": 2,
    "pastCount": 5
  },
  "upcomingEvents": [
    {
      "id": 10,
      "title": "Event title",
      "startsAt": "2026-02-21T18:00:00.000Z",
      "capacity": 20,
      "seatsRemaining": 8,
      "category": "Networking",
      "location": "Bristol",
      "latitude": 51.4518,
      "longitude": -2.5902,
      "imageUrl": null,
      "externalUrl": null,
      "attendeeCount": 12,
      "host": { "id": 1, "name": "Host", "email": "host@example.com" },
      "isHost": true,
      "isAttendee": false,
      "joinedAt": null
    }
  ],
  "pastEvents": []
}
```

---

### 4.4 My Events (Paginated)
**GET** `/profile/me/events?status=&limit=&page=`

**Query params**

| Param    | Type   | Default     | Description |
|----------|--------|-------------|-------------|
| `status` | string | "upcoming" | `"upcoming"`, `"past"`, or `"all"` |
| `limit`  | number | `10`        | Max `50` |
| `page`   | number | `1`         | 1-based page number |

**Response**
```jsonc
{
  "pagination": { "page": 1, "limit": 10, "total": 7 },
  "events": [
    {
      "id": 10,
      "title": "Event title",
      "startsAt": "2026-02-21T18:00:00.000Z",
      "capacity": 20,
      "seatsRemaining": 8,
      "category": "Networking",
      "location": "Bristol",
      "latitude": 51.4518,
      "longitude": -2.5902,
      "imageUrl": null,
      "externalUrl": null,
      "attendeeCount": 12,
      "host": { "id": 1, "name": "Host", "email": "host@example.com" },
      "isHost": true,
      "isAttendee": false,
      "joinedAt": null
    }
  ]
}
```

---

### 4.5 My Reviews (Paginated)
**GET** `/profile/me/reviews?limit=&page=`

**Query params**

| Param   | Type   | Default | Description |
|---------|--------|---------|-------------|
| `limit` | number | `10`    | Max `50` |
| `page`  | number | `1`     | 1-based page number |

**Response**
```jsonc
{
  "pagination": { "page": 1, "limit": 10, "total": 3 },
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great event!",
      "createdAt": "2026-01-15T12:00:00.000Z",
      "author": { "id": 1, "name": "User", "email": "user@example.com" },
      "host": { "id": 2, "name": "Host", "email": "host@example.com" },
      "event": { "id": 3, "title": "Past event", "startsAt": "2025-12-01T18:00:00.000Z" }
    }
  ]
}
```

## 5. Filter Endpoints
These endpoints support filtering events from a single endpoint using optional query params.

**Notes**

- These routes are implemented in `Backend/src/routes/filter.ts`.
- These routes are mounted at `/filter` in `Backend/src/index.ts`.

### 5.1 Nearby Events
**GET** `/filter/nearby`

Returns upcoming events within **10 km** of the provided coordinates.

**Query params**

| Param       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `latitude`  | number | no       | User latitude. Stored in session if provided with `longitude`. |
| `longitude` | number | no       | User longitude. Stored in session if provided with `latitude`. |

**Behavior**

- If query coordinates are not provided, the endpoint will reuse the session location (if available).
- If no coordinates are available from either query or session, the endpoint returns `400`.
- Only events with `latitude` and `longitude` set can be matched.
- Filters to future events: `startsAt >= now`.

**Response**

Returns an array of objects:

- `event`: full Event record (includes `host` and `participants`)
- `distance`: number (km) or `null`
- `attendeeCount`: number

**Example request**

`GET /filter/nearby?latitude=51.4574&longitude=-2.6078`

### 5.2 Search Events (Combined Filters)
**GET** `/filter/search`

Search and filter upcoming events. Any provided filters are combined with **AND**.

**Query params**

| Param              | Type   | Required | Description |
|-------------------|--------|----------|-------------|
| `name`            | string | no       | Case-insensitive match against `title`. |
| `category`        | string | no       | Must match a `Category` enum value (e.g. `Food_Drink`). |
| `attendeeCountMin`| number | no       | Minimum number of attendees (participants). |
| `distance`        | number | no       | Max distance (km). Requires coordinates from query or session. |
| `latitude`        | number | no       | User latitude. Stored in session if provided with `longitude`. |
| `longitude`       | number | no       | User longitude. Stored in session if provided with `latitude`. |
| `rawdate`       | string | no       | Date-only `YYYY-MM-DD`. Includes events starting on/after this day (UTC). |
| `enddate`         | string | no       | Date-only `YYYY-MM-DD`. Includes events starting up to and including this day (UTC). |

**Date filtering notes**

- `rawdate` is interpreted as the event that happen on that UTC day.
- `rawdate` is use to filter the event that HAPPEN ON THAT DATE. 
- `enddate` is interpreted as the event that HAPPEN BEFORE(INCLUDE) THAT DATE FROM NOW.

**Response**

Returns an array of objects:

- `event`: full Event record (includes `host` and `participants`)
- `distance`: number (km) or `null`
- `attendeeCount`: number

**Example request**

`GET /filter/search?name=coffee&category=Food_Drink&attendeeCountMin=3&distance=10&latitude=51.4574&longitude=-2.6078`

### 5.3 Name Search (Hosts/Users)
**GET** `/filter/name`

Returns a list of user/host names that contain the provided query.

**Query params**

| Param | Type   | Required | Description |
|-------|--------|----------|-------------|
| `name` | string | yes      | Case-insensitive substring match against `User.name`. |

**Response**

Returns an array of names (strings). Note: `User.name` can be `null`, so the list may include `null` values.

**Example request**

`GET /filter/name?name=alex`

---

## 6. Chat (REST + Socket)

All chat endpoints require a valid session cookie from `/auth/email/verify`.

### 6.1 Create Or Find Thread
**POST** `/chat/threads`

**Request body (JSON)**

| Field   | Type   | Required | Notes |
|---------|--------|----------|-------|
| `hostId` | number | yes      | The host user id |

**Response**
```json
{ "threadId": 12 }
```

---

### 6.2 List My Threads
**GET** `/chat/threads`

**Response**
Returns all threads where the current user is either host or guest.

---

### 6.3 Search Users (Conversation Search)
**GET** `/chat/users`

Search users in the database for starting a new conversation.

**Query params**

| Param   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `query` | string | no       | Case-insensitive substring match against `User.email` and `User.name`. |

**Response**

Returns up to 25 users ordered by email:

```json
[
  { "id": 2, "name": "Alex", "email": "alex@example.com" }
]
```

**Notes**

- Excludes the current logged-in user.
- If `query` is empty, returns the first 25 users (excluding current user) sorted by email.
- Typical conversation flow is:
  1. `GET /chat/users?query=...`
  2. click a user result
  3. `POST /chat/threads` with `{ hostId }` to get/create `threadId`

---

### 6.4 Thread Messages
**GET** `/chat/threads/:threadId/messages`

**URL params**

| Param      | Type   | Required |
|------------|--------|----------|
| `threadId` | number | yes      |

**Response**
Returns messages in ascending `createdAt` order.

---

### 6.5 Upload Chat Media
**POST** `/chat/upload`

Upload one media file and return a public URL.

**Request**

- `Content-Type`: `multipart/form-data`

| Field  | Type | Required | Notes |
|--------|------|----------|-------|
| `file` | file | yes      | Accepts `image/*` or `video/*`; max size 10MB |

**Response**
```json
{ "url": "https://..." }
```

**Common error responses**

- `400` `{ "message": "No file uploaded" }`
- `400` `{ "message": "Only image and video files are allowed" }`
- `401` `{ "message": "Unauthorized" }`
- `500` `{ "message": "Server misconfiguration: missing UploadThing token" }`
- `500` `{ "message": "Failed to upload file" }`

**Notes**

- Route is mounted under `/chat`, so the full path is `/chat/upload`.
- Requires `UPLOADTHING_TOKEN` (preferred) or `UPLOADTHING_SECRET_KEY` (legacy compatibility).

---

### 6.6 Socket Events

**Connection**
- Client connects to Socket.IO on the same base URL.
- The session cookie must be present.
- If no session user, connection is rejected.

**thread:join**
- Client emits: `{ threadId }` (server also accepts a raw number)
- Server validates membership
- Server joins room `thread:<id>`

**message:send**
- Client emits: `{ threadId, body }`
- Server validates membership
- Server saves message
- Server updates `lastMessageAt`
- Server emits `message:new` to the room
- Media messages can use `body` as a URL marker string, e.g. `IMG::<url>`.

**message:new**
- Server emits: `{ id, threadId, senderId, body, createdAt }`

**chat:error**
- Server emits errors as `chat:error` with a string message.

---

### 6.7 Manual Test Sequence

1. Login via `/auth/email/verify`.
2. Search a user with `GET /chat/users?query=<text>`.
3. Create or fetch a thread with `POST /chat/threads`.
4. (Optional media) Upload with `POST /chat/upload` (`multipart/form-data`, field: `file`) and get `url`.
5. Connect Socket.IO and emit `thread:join`.
6. Emit `message:send` and confirm:
   - Message saved in DB
   - `message:new` received by both users
7. Load history with `GET /chat/threads/:threadId/messages`.

---

## 7. Board Endpoints (General + Q&A)

All board endpoints require a valid session cookie from `/auth/email/verify`.
Routes are mounted under `/board`.

### 7.1 Get General Messages
**GET** `/board/general/:eventId`

Returns general board messages for an event (oldest first).

**URL params**

| Param | Type   | Required |
|-------|--------|----------|
| `eventId` | number | yes |

**Response**

```json
[
  {
    "id": 1,
    "body": "Welcome everyone!",
    "createdAt": "2026-03-08T12:00:00.000Z"
  }
]
```

---

### 7.2 Post General Message (Host Only)
**POST** `/board/general/:eventId`

Only the event host can post to the general board.

**Request body (JSON)**

| Field  | Type   | Required | Notes |
|--------|--------|----------|-------|
| `body` | string | yes      | Trimmed, max length 1000 |

**Response**

Returns the created `General` record.

**Common error responses**

- `400` invalid `eventId` or empty/too-long `body`
- `401` not authenticated
- `403` user is not the event host
- `404` event not found

---

### 7.3 Get Q&A Messages
**GET** `/board/qna/:eventId`

Returns all questions for an event with nested answers, ordered by `createdAt` ascending.
Only the event host or a participant can view.

**URL params**

| Param | Type   | Required |
|-------|--------|----------|
| `eventId` | number | yes |

**Response**

```json
[
  {
    "id": 10,
    "body": "Is parking available?",
    "authorId": 3,
    "createdAt": "2026-03-08T12:00:00.000Z",
    "answers": [
      {
        "id": 21,
        "body": "Yes, free parking nearby.",
        "authorId": 1,
        "createdAt": "2026-03-08T12:05:00.000Z"
      }
    ]
  }
]
```

**Common error responses**

- `400` invalid `eventId`
- `401` not authenticated
- `403` user is not host/participant for this event
- `404` event not found

---

### 7.4 Post Question
**POST** `/board/qna/:eventId/question`

Only the event host or a participant can post a question.

**Request body (JSON)**

| Field  | Type   | Required | Notes |
|--------|--------|----------|-------|
| `body` | string | yes      | Trimmed, max length 1000 |

**Response**

Returns the created `Question` record.

**Common error responses**

- `400` invalid `eventId` or empty/too-long `body`
- `401` not authenticated
- `403` user is not host/participant for this event
- `404` event not found

---

### 7.5 Post Answer
**POST** `/board/qna/:eventId/answer`

Only the event host or a participant can post an answer.

**Request body (JSON)**

| Field       | Type             | Required | Notes |
|-------------|------------------|----------|-------|
| `questionId`| number \| string | yes      | Must be a valid positive integer and belong to this event |
| `body`      | string           | yes      | Trimmed, max length 1000 |

**Response**

Returns the created `Answer` record.

**Common error responses**

- `400` invalid `eventId`, `questionId`, or empty/too-long `body`
- `401` not authenticated
- `403` user is not host/participant for this event
- `404` event not found, or question does not belong to that event

