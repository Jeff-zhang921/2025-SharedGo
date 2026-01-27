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
- [1. Event Endpoints](#1-event-endpoints)
  - [1.1 Create Event](#11-create-event)
  - [1.2 Get Event Details](#12-get-event-details)
  - [1.3 Join Event](#13-join-event)
  - [1.4 Create Review for Event](#14-create-review-for-event)
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
## 1. Event Endpoints

All POST endpoints require an authenticated session cookie from /auth/email/verify.

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

**Response**

Returns the created event, including:

- Event fields
- Host info
- `attendeeCount` (number of participants)

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
| `latitude` | number | user's latitude for distance calculation|
| `longitude` | number | user's longitude for distance calculation|

**Example requests**
-  search 
  `GET /home/?search=coffee`

- with coordinates of user  
  `GET /home/?latitude=51.4574&longitude=-2.6078`

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
    //Top 5 events starting soonest
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

