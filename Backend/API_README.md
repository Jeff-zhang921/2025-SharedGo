# SharedGo Backend API

**Base URL:** `http://localhost:3000`

This section documents the endpoints used by **Frontend**

- Event details, join, review
- Host tabs: **Upcoming**, **Past events**, **Overview**, **Reviews**

---

## 1. Event Endpoints

### 1.1 Create Event

**POST** `/events/create`

Create a new event for a host.

**Request body (JSON)**

| Field         | Type   | Required | Notes                                |
|--------------|--------|----------|--------------------------------------|
| `title`      | string | yes      | Event title                          |
| `startsAt`   | string | yes      | ISO datetime string                  |
| `location`   | string | yes      | Text description of the location     |
| `hostEmail`  | string | yes      | Email of the host user               |
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
| `email` | string | yes      | Attendee email           |
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
| `email`   | string | yes      | Author’s email (must have joined)   |
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
      "startsAt": "2025-11-21T18:00:00.000Z",
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

