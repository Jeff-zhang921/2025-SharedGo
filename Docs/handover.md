# SharedGo Handover

## Contents
- [Introduction](#introduction)
- [Build and Execution](#build-and-execution)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Structure](#database-structure)
- [AWS Setup](#aws-setup)
- [Further Documentation](#further-documentation)

## Introduction
This document is a technical handover for the SharedGo repository. It is intended to help a new developer understand how the system is put together, how to run it locally, where the important code lives, and how the current deployment works.

SharedGo is a full-stack TypeScript application built around a map-based event discovery and hosting workflow. The current implementation uses:

- React + TypeScript + Vite on the frontend
- Express + TypeScript + Prisma on the backend
- PostgreSQL as the database
- Socket.IO for real-time chat
- UploadThing for image and media uploads
- Docker + Nginx for containerized delivery
- AWS ECR + EC2 for deployment

> [!NOTE]
> Some older markdown files in the repository describe earlier versions of the project or partial setups. When in doubt, treat the runtime source files as the source of truth:
> `Backend/src/index.ts`, `Backend/prisma/schema.prisma`, `Frontend/src/App.tsx`, the Dockerfiles, and `.github/workflows/*.yml`.

## Build and Execution
### Quick Links
- [Prerequisites](#prerequisites)
- [Environment Variables Setup](#environment-variables-setup)
- [Backend](#backend-express-api-prisma-and-socketio)
- [Frontend](#frontend-react--vite)
- [Full Stack Local Development](#full-stack-local-development)
- [Docker Compose Stack](#docker-compose-stack)

### Prerequisites
- Node.js 20 is the safest local choice. The repo currently uses Node 18 in backend CI and Node 20 in Docker/frontend CI.
- npm
- PostgreSQL
- Git
- Optional: Docker and Docker Compose
- Optional: Gmail SMTP credentials for the email verification flow
- Optional: UploadThing credentials for image upload features

Clone the repository with either:

- `git clone https://github.com/spe-uob/2025-SharedGo.git`
- `git clone git@github.com:spe-uob/2025-SharedGo.git`

### Environment Variables Setup
There are two separate env surfaces in the project:

- Backend runtime variables, consumed through `process.env`
- Frontend Vite variables, consumed through `import.meta.env`

Example values for local development:

```env
# Backend
DATABASE_URL="postgresql://sharedgo_user:password@localhost:5432/sharedgo?schema=public"
PORT=3000
FRONTEND_URL="http://localhost:5173"
SMTP_USER="your-gmail-address@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SharedGo <no-reply@sharedgo.local>"
LOGIN_CODE_SECRET="change-me"
UPLOADTHING_TOKEN="your-uploadthing-token"
NODE_ENV="development"

# Frontend
VITE_API_URL="http://localhost:3000/api"
VITE_SOCKET_URL="http://localhost:3000"
```

Backend variables in use:

- `DATABASE_URL`: required by Prisma and the backend database connection
- `PORT`: optional, defaults to `3000`
- `FRONTEND_URL`: optional, defaults to `http://localhost:5173`; used for CORS and Socket.IO
- `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: used by the email verification login flow and participant list emails
- `LOGIN_CODE_SECRET`: required to hash email verification codes
- `UPLOADTHING_TOKEN` or `UPLOADTHING_SECRET_KEY`: required for image/media upload routes
- `NODE_ENV`: relevant for testing and auth middleware behavior

Frontend variables in use:

- `VITE_API_URL`: must include the `/api` prefix, for example `http://localhost:3000/api`
- `VITE_SOCKET_URL`: should point to the backend origin without `/api`, for example `http://localhost:3000`

> [!IMPORTANT]
> The backend does not currently import `dotenv` at runtime. Prisma commands will read `Backend/.env`, but `npm run dev` for the Express app expects the variables to already exist in the shell or container environment.

> [!NOTE]
> The frontend does use Vite env handling, so a `Frontend/.env.local` file is a normal local-development option.

### Backend (Express API, Prisma, and Socket.IO)
From the repository root:

```bash
cd Backend
npm ci
npx prisma generate
npx prisma migrate dev
npx ts-node src/seed.ts
npm run dev
```

Useful backend commands:

- `npm run dev`: start the backend in development mode
- `npm test`: run the Jest test suite in `Backend/tests`
- `npm run lint`: run ESLint
- `npm run build`: compile TypeScript to `dist`

Runtime behavior:

- Express listens on `http://localhost:3000` by default
- REST endpoints are mounted under `http://localhost:3000/api`
- Socket.IO uses the same backend origin at `/socket.io/`

### Frontend (React + Vite)
From the repository root:

```bash
cd Frontend
npm ci
npm run dev
```

Useful frontend commands:

- `npm run dev`: start the Vite dev server
- `npm run build`: type-check and produce a production build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

There is currently no frontend test script in `Frontend/package.json`. The checked-in frontend automation is focused on linting and build verification.

Runtime behavior:

- The default dev server is `http://localhost:5173`
- The app is a React SPA with routes defined in `Frontend/src/App.tsx`
- PWA support is configured in `Frontend/vite.config.ts` using `vite-plugin-pwa`

### Full Stack Local Development
The main source-based local setup is:

1. Start PostgreSQL and make sure `DATABASE_URL` points to it.
2. Start the backend from `Backend/`.
3. Start the frontend from `Frontend/`.
4. Open `http://localhost:5173`.

Important local notes:

- Session-based authentication depends on cookies, so frontend requests use `credentials: "include"`
- Email login will not work unless SMTP credentials and `LOGIN_CODE_SECRET` are configured
- Image upload routes will not work unless UploadThing credentials are configured
- Prisma schema changes should be applied with `npx prisma migrate dev`

### Docker Compose Stack
The root `docker-compose.yml` is not a source-build local development stack. It runs prebuilt images from Amazon ECR:

```bash
docker compose up
docker compose down
```

Current behavior of the compose file:

- `backend` runs the image `588738568626.dkr.ecr.eu-north-1.amazonaws.com/sharedgo:latest`
- `frontend` runs the image `588738568626.dkr.ecr.eu-north-1.amazonaws.com/sharedgo_frontend:latest`
- Backend is exposed on `localhost:3000`
- Frontend is exposed on `localhost:8080`
- Only the backend service reads a root `.env` file
- No PostgreSQL service is defined in the compose file

This makes the compose file most useful for deployment hosts or for local users who already have access to the published ECR images.

## System Architecture
The current system is a browser SPA talking to a cookie-authenticated Express API backed by PostgreSQL, with real-time chat handled over Socket.IO.

![Architecture Diagram](Architecture/architecture_final.png)

High-level flow:

1. Users log in through an email verification flow.
2. The backend stores a hashed verification code in the `LoginCode` table and creates a session on successful verification.
3. The frontend calls REST endpoints under `/api` for events, profile, host dashboards, filtering, boards, and uploads.
4. Chat threads are created and listed via REST, then used in real time via Socket.IO rooms.
5. Prisma is the data-access layer and `Backend/prisma/schema.prisma` is the database source of truth.
6. In the containerized setup, Nginx serves the built frontend and proxies `/api` and `/socket.io/` traffic to the backend container.

Important architectural details:

- Authentication is session-cookie based, not JWT based
- Backend routes are all mounted inside `/api`
- Chat image and board image attachments are stored as uploaded URLs, often embedded into text fields using the `IMG::` prefix convention
- Geospatial event behavior currently relies on stored latitude and longitude plus Haversine distance calculations inside route handlers

> [!WARNING]
> Sessions currently use the default Express MemoryStore from `express-session`. That is acceptable for local development and single-instance hosting, but not for a horizontally scaled multi-instance production setup.

## Project Structure
The top-level project structure is:

```text
.
|-- .github/               # Issue templates, PR template, and GitHub Actions workflows
|-- Backend/               # Express API, Prisma schema, Socket.IO, tests
|-- Docs/                  # Architecture, database diagrams, workflows, presentations
|-- Frontend/              # React + Vite application and nginx config
|-- docker-compose.yml     # Container stack using published ECR images
|-- package.json           # Minimal root package metadata
`-- README.md              # Main project overview
```

### Quick Links
- [`.github`](#github)
- [`Docs`](#docs)
- [`Backend`](#backend)
- [`Frontend`](#frontend)
- [Root Files](#root-files)

### `.github`
Key repository automation lives in `.github/workflows/`:

- `backend-ci.yml`: runs backend linting, Prisma generate/migrate, tests, and build
- `frontend-ci.yml`: intended frontend CI workflow
- `cd.yml`: builds backend/frontend Docker images, pushes them to ECR, then deploys to EC2 over SSH

This folder also contains the issue templates and PR template used by the repository.

### `Docs`
The `Docs/` folder is a mix of diagrams, meeting artifacts, presentations, and supporting technical notes.

Key subdirectories:

- `Architecture/`: system and CI/CD diagrams
- `database/`: database diagrams
- `design/`: design images and mockups
- `Minutes/`: meeting notes
- `Presentations/`: project presentation decks
- `Workflow/`: workflow diagrams for chat, login, map, and board behavior

Key files:

- `Docs/database_setup.md`: EC2 + PostgreSQL setup notes
- `Docs/AI Tools.md`: project AI-usage documentation
- `Docs/testing_day_survey.pdf`: testing feedback artifact

### `Backend`
The backend is a TypeScript Express application with Prisma and Socket.IO.

```text
Backend/
|-- prisma/
|   |-- migrations/        # Prisma migrations
|   `-- schema.prisma      # Database schema source of truth
|-- src/
|   |-- api/               # Upload endpoints
|   |-- middleware/        # Request/session middleware
|   |-- routes/            # REST route handlers
|   |-- socket/            # Socket.IO bootstrap and events
|   |-- types/             # Express/session typings
|   |-- index.ts           # Express bootstrap and route mounting
|   |-- seed.ts            # Seed script
|   `-- session.ts         # express-session configuration
|-- tests/                 # Jest tests by feature area
|-- API_README.md          # Backend endpoint reference
|-- DEVELOPER_README.md    # Backend setup notes
|-- Dockerfile             # Multi-stage production image
`-- package.json           # Backend scripts and dependencies
```

Key backend files and their roles:

- `src/index.ts`: creates the Express app, applies CORS and session middleware, mounts all `/api` routes, and starts the HTTP server used by both Express and Socket.IO
- `src/session.ts`: central `express-session` configuration
- `src/routes/auth.ts`: email-code login, verification, current-user lookup, logout, and participant-list email sending
- `src/routes/events.ts`: event CRUD, join/leave, review creation, category handling, and distance-aware event listing
- `src/routes/hosts.ts`: host overview stats, host event lists, and host reviews
- `src/routes/profile.ts`: logged-in user profile endpoints and event/review history
- `src/routes/filter.ts`: nearby search, combined event filtering, and user-name search
- `src/routes/chat.ts`: chat thread creation, listing, user lookup, and message history
- `src/routes/board.ts`: event general board and event Q&A board
- `src/api/upload.ts`: UploadThing-backed image/media upload route
- `src/socket/index.ts`: chat socket authentication, room joins, and `message:new` broadcasting
- `src/middleware/requireSession.ts`: shared session guard used by protected routes
- `prisma/schema.prisma`: Prisma models, enums, and relations
- `tests/*.test.ts`: backend coverage for auth, events, filter, board, chat, upload, profile, hosts, seed, and session middleware

### `Frontend`
The frontend is a React + TypeScript SPA built with Vite.

```text
Frontend/
|-- public/                # Static assets and PWA icons
|-- src/
|   |-- components/        # Shared components
|   |-- pages/             # Route-level UI
|   |-- App.tsx            # Route tree
|   |-- main.tsx           # React bootstrap
|   |-- index.css          # Global styles
|   `-- searchFile.tsx     # Shared search/filter context
|-- nginx.conf             # Nginx reverse-proxy and static file config
|-- vite.config.ts         # Vite + PWA configuration
|-- Dockerfile             # Build static app and serve with nginx
`-- package.json           # Frontend scripts and dependencies
```

Key frontend files and their roles:

- `src/main.tsx`: React bootstrap, router setup, and shared search provider
- `src/App.tsx`: defines the main routes and the navigation-shell layout
- `src/pages/loginPage.tsx`: email entry screen for the login flow
- `src/pages/verifyPage.tsx`: verification-code entry screen
- `src/pages/homePage.tsx`: landing page after login
- `src/pages/mapPage.tsx`: Leaflet map, geolocation, filtering, and event marker interactions
- `src/components/EventDetailsSidebar.tsx`: central event detail panel, join/leave flow, host actions, and entry point to board/chat
- `src/pages/createEventPage.tsx`: event creation form and live preview
- `src/pages/chatPage.tsx`: one-to-one chat UI using Socket.IO
- `src/pages/ConversationPage.tsx`: conversation list and user search for chat
- `src/pages/boardPage.tsx`: event board UI for general posts and Q&A
- `src/pages/profilePage.tsx`: current-user profile and joined/hosted event overview
- `src/pages/hostPage.tsx`: host dashboard and host event summaries
- `nginx.conf`: serves the built SPA and proxies `/api` plus `/socket.io/` to the backend container

### Root Files
Important root files:

- `README.md`: general project overview
- `docker-compose.yml`: deployment-oriented compose file using published ECR images
- `package.json`: minimal root-level package metadata, not the main app entrypoint
- `LICENSE`: repository license

## Database Structure
The database is defined in Prisma and stored in PostgreSQL.

![Database Diagram](database/database_final.png)

### Quick Links
- [User](#user)
- [Event](#event)
- [EventParticipant](#eventparticipant)
- [Review](#review)
- [LoginCode](#logincode)
- [ChatThread](#chatthread)
- [ChatMessage](#chatmessage)
- [Question](#question)
- [Answer](#answer)
- [General](#general)
- [Category Enum](#category-enum)

### User
Primary account model for all users in the system.

- Core fields: `id`, `email`, `name`, `createdAt`, `updatedAt`
- A user can host events, join events, author reviews, receive reviews as a host, send chat messages, and post board content
- The same table is used for both normal attendees and event hosts

### Event
Represents a published event shown in the app.

- Core fields: `id`, `title`, `description`, `startsAt`, `capacity`, `category`, `location`, `latitude`, `longitude`, `imageUrl`, `externalUrl`
- `hostId` links the event to its organizer
- Relations: participants, reviews, Q&A questions, and general board posts

### EventParticipant
Join table linking a user to an event they joined.

- Core fields: `eventId`, `userId`, `joinedAt`
- Composite uniqueness: `@@unique([eventId, userId])`
- Used for attendee counts, profile views, host stats, and review eligibility

### Review
Stores attendee feedback on events and hosts.

- Core fields: `id`, `rating`, `comment`, `eventId`, `hostId`, `authorId`, `createdAt`
- Each attendee can only review a given event once: `@@unique([eventId, authorId])`
- Used in event details, host dashboards, and user profile history

### LoginCode
Stores email verification codes for login.

- Core fields: `id`, `email`, `codeHash`, `expiresAt`, `attempts`, `usedAt`, `createdAt`
- Codes are hashed before storage
- Used by the email login flow in `Backend/src/routes/auth.ts`

### ChatThread
Represents a one-to-one conversation between two users.

- Core fields: `id`, `hostId`, `guestId`, `lastMessageAt`, `createdAt`, `updatedAt`
- Composite uniqueness: `@@unique([hostId, guestId])`
- Relations: host user, guest user, and child `ChatMessage` rows

### ChatMessage
Represents one message inside a chat thread.

- Core fields: `id`, `threadId`, `senderId`, `body`, `createdAt`
- Real-time chat uses Socket.IO, but messages are persisted in PostgreSQL
- Image messages are represented as body strings with an `IMG::` URL prefix

### Question
Represents one Q&A board question attached to an event.

- Core fields: `id`, `eventId`, `body`, `authorId`, `createdAt`
- Cascade delete is enabled through Prisma relations
- Each question can have multiple `Answer` rows

### Answer
Represents an answer to a board question.

- Core fields: `id`, `questionId`, `body`, `authorId`, `createdAt`
- Linked to a `Question` and a `User`
- Used in the event Q&A board UI

### General
Represents an event general-board post.

- Core fields: `id`, `eventId`, `authorId`, `body`, `createdAt`
- Intended for event-wide announcements and updates
- Current route permissions allow only the event host to post in the general board

### Category Enum
The `Category` enum in Prisma currently contains:

- `Physical_Activities`
- `Festivals`
- `Educational`
- `Networking`
- `Arts_Culture`
- `Food_Drink`
- `Music_Concerts`
- `Tech_Gaming`
- `Wellness_Meditation`
- `Volunteer_Charity`
- `Other`

## AWS Setup
The current repository reflects a Docker-to-ECR-to-EC2 deployment flow rather than an ECS/RDS setup.

### Current Deployment Model
Deployment is driven by `.github/workflows/cd.yml`.

On pushes to `dev` or `main`, the workflow:

1. Builds a backend Docker image from `Backend/`
2. Builds a frontend Docker image from `Frontend/`
3. Pushes the images to Amazon ECR
4. SSHes into the EC2 host
5. Runs `docker compose pull`
6. Runs `docker compose up -d --remove-orphans`

Current image names:

- Backend ECR repository: `sharedgo`
- Frontend ECR repository: `sharedgo_frontend`
- AWS region: `eu-north-1`

### EC2 Runtime Layout
The EC2 host uses the root `docker-compose.yml`, which currently defines:

- `backend`: Express API container on port `3000`
- `frontend`: Nginx container serving the built React app on host port `8080`

Container behavior:

- Both services share the `app-network` bridge network
- `Frontend/nginx.conf` proxies `/api/` and `/socket.io/` to `backend:3000`
- Frontend static assets are served directly by Nginx

### Database Hosting
The repository documentation currently points to PostgreSQL being hosted separately from the app containers.

- `Docs/database_setup.md` documents a PostgreSQL-on-EC2 setup
- The database is therefore external to `docker-compose.yml`
- The backend relies on `DATABASE_URL` to reach that database

### Required Secrets and Config
The deployment flow currently depends on:

- GitHub Actions secrets for AWS credentials
- GitHub Actions secret `EC2_SSH_KEY`
- GitHub Actions secrets `VITE_API_URL` and `VITE_SOCKET_URL` for the frontend image build
- A backend `.env` file or equivalent environment injection on the EC2 host for database, SMTP, auth, and upload settings

> [!IMPORTANT]
> The frontend Docker image bakes `VITE_API_URL` and `VITE_SOCKET_URL` at build time. Changing API or socket endpoints requires rebuilding and republishing the frontend image.

### Operational Notes
Current operational constraints worth knowing:

- Session storage is in-memory, so multi-instance backend scaling would require a shared session store
- The compose file does not provision PostgreSQL
- `sharedgo.link` is referenced in deployment config and nginx `server_name`
- The compose stack uses published ECR images, not local Docker builds

## Further Documentation
### Internal Project Documents

| File | Purpose |
|------|---------|
| `README.md` | Main project overview |
| `Backend/API_README.md` | Endpoint-level backend API reference |
| `Backend/DEVELOPER_README.md` | Backend setup notes |
| `Docs/database_setup.md` | PostgreSQL and EC2 setup notes |
| `Docs/AI Tools.md` | AI tool usage documentation |
| `Docs/Architecture/architecture_final.png` | Main architecture diagram |
| `Docs/Architecture/ci_cd_2.png` | CI/CD diagram |
| `Docs/database/database_final.png` | Database diagram |
| `Docs/Workflow/Chat Workflow.png` | Chat workflow diagram |
| `Docs/Workflow/EventBoard.png` | Event board workflow diagram |
| `Frontend/README.md` | Frontend-specific setup notes |

### External Documentation

| Tool | Documentation |
|------|---------------|
| React | https://react.dev/ |
| Vite | https://vite.dev/guide/ |
| Express | https://expressjs.com/ |
| Prisma | https://www.prisma.io/docs/ |
| PostgreSQL | https://www.postgresql.org/docs/ |
| Socket.IO | https://socket.io/docs/v4/ |
| UploadThing | https://docs.uploadthing.com/ |
| Docker | https://docs.docker.com/ |
| Nginx | https://nginx.org/en/docs/ |
| AWS ECR | https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html |
| GitHub Actions | https://docs.github.com/en/actions |
