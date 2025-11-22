# SharedGo Backend API (Host page focused)

Base URL: `http://localhost:3000`

## Events
- `POST /events/create`  
  Body: `title` (string, required), `startsAt` (ISO string, required), `location` (string, required), `hostEmail` (string, required), optional `description`, `imageUrl`, `externalUrl`, `capacity` (number).  
  Returns: created event with host info and attendee count.


- `GET /events/:id`  
  Params: `id` (number).  
  Returns: event fields, host, attendees (id, name, email, joinedAt), `attendeeCount`, `seatsRemaining`, `averageRating`, and `reviews` (id, rating, comment, createdAt, author info).


- `POST /events/:id/join`  
  Params: `id`. Body: `email` (required), optional `name`.  
  Returns: joined attendee (id, name, email, joinedAt). Handles already-joined and capacity-full cases.


- `POST /events/:id/reviews`  
  Params: `id`. Body: `email` (required), optional `rating` (1–5), optional `comment`. Requires the user to have joined and the event to have started.  
  Returns: saved review with author and event summary.



## Host (tabs: Upcoming, Past events, Overview, Reviews)
- `GET /hosts/:hostId/overview`  
  Params: `hostId` (number).  
  Returns: host info; stats (`totalEvents`, `upcomingCount`, `pastCount`, `totalAttendees`, `averageFillRate`, `averageRating`, `reviewCount`); preview lists for upcoming/past events (id, title, startsAt, capacity, attendeeCount, seatsRemaining); recent reviews (author + event summary).

- `GET /hosts/:hostId/events?status=upcoming|past|all&limit=&page=`  
  Params: `hostId`. Query: `status` (default `upcoming`), `limit` (default 10, max 50), `page` (default 1).  
  Returns: pagination + events (id, title, startsAt, capacity, location, attendeeCount, seatsRemaining).

- `GET /hosts/:hostId/reviews?limit=&page=`  
  Params: `hostId`. Query: `limit` (default 10, max 50), `page` (default 1).  
  Returns: pagination + reviews (id, rating, comment, createdAt, author info, event summary).
