// //Execution Order

// Install Socket.IO deps

// From Backend, install socket.io and socket.io.
// Command (example): npm install socket.io and socket.io
// Update Prisma schema

// Edit schema.prisma.
// Add ChatThread and ChatMessage.
// Add thread/message relations on User.
// Add unique constraint (hostId, guestId).
// Run Prisma migration

// Run npx prisma migrate dev --name chat.
// Run npx prisma generate.


// Extract session middleware
// Move the express-session config from index.ts into a shared module (e.g. session.ts).
// Export the middleware so Socket.IO can reuse it.




// Create Socket.IO bootstrap
// Add a new file for socket init, e.g. index.ts.
// Create Socket.IO server, attach to HTTP server.
// Reuse the session middleware for Socket.IO auth.
// Store user on socket.data.user.

// Define socket event flow
// thread:join → validate thread membership → join room.
// message:send → validate → persist message → emit message:new.



// Add chat REST routes
// Create chat.ts.
// Endpoints:
// POST /chat/threads (create/find thread)
// GET /chat/threads (list threads)
// GET /chat/threads/:id/messages (history)
// POST /chat/threads/:id/read (mark read)
// Use requireSession for auth.

// Mount routes
// In index.ts, mount /chat router.

// Wire Socket.IO to HTTP server
// Replace app.listen with http.createServer(app).listen.
// Call your socket init with that server.






// Update docs
// Add chat endpoints and socket events to API_README.md.
// Manual test sequence

// Login and create a thread (POST /chat/threads).
// Join socket room (thread:join).
// Send message (message:send) and confirm:
// DB write happened
// message:new event emitted to both users
// Load history via REST.
// Validate read/unread counts.
// Production note (later)

// Replace MemoryStore with Redis.
// Add Socket.IO Redis adapter if scaling.