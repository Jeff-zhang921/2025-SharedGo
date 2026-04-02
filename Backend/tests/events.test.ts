import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

// Mock Prisma client, without using real database
// Each method used by the route handlers is replaced by a Jest mock
// (so tests can control returned values and assert calls if needed).
const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  event: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eventParticipant: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  review: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

// Replace the real PrismaClient export with our mock implementation.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

import eventRouter from "../src/routes/events";
let loggedOut = false;
const testApp = express();
testApp.use(express.json());
testApp.use((req: Request, res: Response, next: NextFunction) => {
    if(loggedOut) {
        req.session = {} as Partial<Session> as Session;
    } else {
        req.session = {
            user: {
                id: 1, 
                email: "user@example.com",
                name: "Test user",
                provider: "email",
            }
        } as Partial<Session> as Session;
    }
    next();
});
testApp.use("/events", eventRouter);

afterAll(async () => { //disconnect after tests are done
  await mockPrisma.$disconnect();
});

const createEvent = (overrides = {}) => ({
  id: 123,
  title: "Test Event",
  description: "This is a test event",
  startsAt: new Date(),
  capacity: 50,
  category: "Other",
  location: "Test Location",
  latitude: 51.5,
  longitude: -.01,
  hostId: 1,
  host: {
    id: 1,
    email: "host@example.com",
    name: "Host",
  },
  participants: [{
    userId: 2,
    user: {
      id: 2,
      email: "user@example.com",
      name: "User",
    },
    joinedAt: new Date(),
  }],
  reviews: [],
  ...overrides,
});
  
describe("Event API", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    loggedOut = false;
  });
  describe("input validation", () => {
  // Define a table: [Request Body, Expected Status, Expected Message]
  test.each([
    // POST /create missing fields
    [{}, 400, "Title is required."],
    [{ title: "A" }, 400, "Start date/time is required."],
    [{ title: "A", startsAt: "invalid" }, 400, "Start date/time is invalid."],
    [{ title: "A", startsAt: "2026-01-01" }, 400, "Location is required."],
    [{ title: "A", startsAt: "2026-01-01", location: "L" }, 400, "Host email is required to publish an event."],
    [{ title: "A", startsAt: "2026-01-01", location: "L", hostEmail: "e@e.com" }, 400, "Latitude and longitude are required."],
    [{ title: "A", startsAt: "2026-01-01", location: "L", hostEmail: "e@e.com", latitude: 100, longitude: 0 }, 400, "Invalid latitude or longitude values."],
    [{ title: "A", startsAt: "2026-01-01", location: "L", hostEmail: "e@e.com", latitude: 0, longitude: 0, capacity: -1 }, 400, "Capacity must be a positive number."],
    ])("POST /create with %j should return %i %s", async (body, status, message) => {
      const res = await request(testApp).post("/events/create").send(body);
      expect(res.status).toBe(status);
      expect(res.body.message).toBe(message);
    });
  });
 
  describe("POST /events/create", () => {
    it("should create a new event", async () => {
      mockPrisma.user.upsert.mockResolvedValue({
        id: 1,
        email: "host@example.com"
      });
      mockPrisma.event.create.mockResolvedValue(createEvent());
      const res = await request(testApp)
        .post("/events/create")
        .send({
          title: "Test Event",
          description: "This is a test event",
          startsAt: "2024-12-31T22:00:00.000Z",
          capacity: 50,
          category: "Other",
          location: "Test Location",
          latitude: 51.5,
          longitude: -.01,
          hostEmail: "host@example.com",
        });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Event created successfully.");
      expect(res.body.event.title).toBe("Test Event");
      expect(res.body.event.host.email).toBe("host@example.com");
    });
    it("should return 400 for invalid coordinates", async () => {
      const res = await request(testApp)
        .post("/events/create")
        .send({
          title: "Test Event",
          description: "This is a test event",
          startsAt: "2024-12-31T22:00:00.000Z",
          capacity: 50,
          category: "Other",
          location: "Test Location",
          latitude: 100, // invalid latitude
          longitude: 200, // invalid longitude
          hostEmail: "host@example.com",
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid latitude or longitude values.");
    });
  });

  describe("GET /events/id", () => {
    it("should get event details", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        participants: [
          {
            user: {
              id: 2,
              email: "user@example.com",
              name: "User",
            },
            joinedAt: new Date(),
          },
        ],
      }));

      const res = await request(testApp).get(`/events/123`);

      expect(res.status).toBe(200);
      expect(res.body.attendeeCount).toBe(1);
      expect(res.body.seatsRemaining).toBeLessThanOrEqual(49);
    });
    it("should return 404 for non-existent event when getting details", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      const res = await request(testApp).get("/events/9999");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Event not found.");
    });

    it("should return 400 for invalid event ID format", async () => {
      const res = await request(testApp).get("/events/not-a-number");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Event id must be a number.");
    });
    it("should list all events and sort by distance if coordinates are provided", async () => {
      const farEvent = createEvent({ id: 1, latitude: 40, longitude: 40 });
      const nearEvent = createEvent({ id: 2, latitude: 1, longitude: 1 });
      mockPrisma.event.findMany.mockResolvedValue([farEvent, nearEvent]);
      // Query with lat/lon at 0,0
      await request(testApp).get("/events?latitude=0&longitude=0");
      const res = await request(testApp).get("/events?latitude=0&longitude=0");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Event 2 (1,1) is closer to (0,0) than Event 1 (40,40)
      expect(res.body[0].id).toBe(2); 
      expect(res.body[0].distance).toBeDefined();
    });
    it("should handle null coordinate by ignoring distance sorting", async () => {
      mockPrisma.event.findMany.mockResolvedValue([createEvent(
        { id: 1, latitude: null, longitude: null }
      )]);
      const res = await request(testApp).get("/events?latitude=51.5&longitude=-0.01");
      expect(res.status).toBe(200);
      expect(res.body[0].distance).toBeNull();
    });
    it("returns a formatted distance for an event that has lat/lon", async () => {
      mockPrisma.event.findMany.mockResolvedValue([
        createEvent({ id: 11, latitude: 48.86, longitude: 2.35 }),
      ]);
      const res = await request(testApp).get("/events?latitude=51.5&longitude=-0.01"); 
  
      expect(res.status).toBe(200);
      expect(typeof res.body[0].distance).toBe("number"); 
      expect(res.body[0].distance).toBeGreaterThan(0);
    });
    it("should return 500 if database fetch fails", async () => {
      mockPrisma.event.findMany.mockRejectedValue(new Error("DB Error"));
      const res = await request(testApp).get("/events");
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error while fetching events.");
    });
  });

  describe( "POST /events/id/join", () => {
    it("should join an event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        participants: [], // ensure event is not full and user is not already a participant
      }));
      mockPrisma.eventParticipant.create.mockResolvedValue({
        user: {
          id: 2,
          email: "user@example.com",
          name: "Test User"
        },
        joinedAt: new Date(),
      });
      const res = await request(testApp)
        .post(`/events/123/join`)
        .send({
          email: "user@example.com",
          name: "Test User",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Joined the event successfully.");
      expect(res.body.attendee).toHaveProperty("email", "user@example.com");
    });

    
    it("should not allow joining with missing email", async () => {
      const res = await request(testApp)
        .post(`/events/123/join`)
        .send({
          name: "Test User",
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Email is required to join the event.");
    });

    it("should not allow joining non-existent event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null); // event not found
      const res = await request(testApp)
        .post("/events/9999/join")
        .send({
          email: "user@example.com",
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Event not found.");
    });
    it("should not allow joining a full event", async () => {
      // Mock full event (capacity 1, already has 1 participant)
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        capacity: 1,
        participants: [
          {
            user: {
              email: "existing@example.com",
            },
          },
        ],
      }));

      const res = await request(testApp)
        .post(`/events/123/join`)
        .send({
          email: "newuser@example.com",
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("message", "Event is already full.");
    });
    it("should return already joined message for duplicate participation", async () => {
      // Mock event where the user is already in the participants list
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        participants: [{
            user: {
              email: "user@example.com",
            },
          },
        ],
      }));

      const res = await request(testApp)
        .post(`/events/123/join`)
        .send({
          email: "user@example.com", // same email trying to join
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "You have already joined this event.");
    });
  });
  
  describe("POST /events/id/reviews", () => {
    it("should not allow if user is not a participant", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        participants: [
          { user : {
            email: "user@example.com"
          }}
        ],
      }));
      const res = await request(testApp)
        .post(`/events/123/reviews`)
        .send({
          email: "nonparticipant@example.com",
          rating: 5,
          comment: "Great event!",
        });
      expect(res.status).toBe(403);
    });
    it ("should upsert review if valid", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        startsAt: new Date(Date.now() - 60 * 60 * 1000), // event started 1 hour ago
        participants: [
          { userId: 2,
            user : {
            email: "user@example.com"
          }}
        ],
      }));
      mockPrisma.review.upsert.mockResolvedValue({
        id: 1,
        rating: 5,
        comment: "Great event!",
        event: {
          id: 123,
          title: "Test Event",
        },
        author: {
          id: 2,
          name: "User",
          email: "user@example.com"
        },
        createdAt: new Date(),
      });
      const res = await request(testApp)
        .post(`/events/123/reviews`)
        .send({
          email: "user@example.com",
          rating: 5,
          comment: "Great event!",
        });
      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);
    });

    it("should not allow reviews for events that haven't started", async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 123,
        startsAt: new Date("2030-01-01T00:00:00Z"), // event starts in the future
        hostId: 1,
        participants: [
          {
            user: {
              email: "user@example.com",
            },
          },
        ],
      });
      const res = await request(testApp)
        .post(`/events/123/reviews`)
        .send({
          email: "user@example.com",
          rating: 5,
          comment: "Great event!",
        });
        
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Reviews can be left only after the event starts.");
    });
    it("should return 400 if neither rating nor comment is provided", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        startsAt: new Date(Date.now() - 60 * 60 * 1000), // event started 1 hour ago
        participants: [
          { userId: 2,
            user : {
            email: "user@example.com"
          }}
        ],
      }));
      const res = await request(testApp)
        .post(`/events/123/reviews`)
        .send({
          email: "user@example.com",
          rating: null,
          comment: null,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Provide at least a rating or a comment.");
    });
    it("should return 400 if rating is not an integer", async () => {
      const res = await request(testApp).post("/events/123/reviews")
        .send({
          email: "user@example.com", 
          rating: 4.5 // Not an integer
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Rating must be an integer between 1 and 5.");
    });
    it("should block reviews for events in the future", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({ 
        startsAt: new Date("2030-01-01T00:00:00Z"), // event in the future 
        participants: [
          { userId: 2,
            user : {
            email: "user@example.com",
          }}
        ]
      }));
      const res = await request(testApp).post("/events/123/reviews").send({
        email: "user@example.com", rating: 5
      });
      expect(res.status).toBe(400); 
      expect(res.body.message).toBe("Reviews can be left only after the event starts.");
    });

  });
  describe("patch input validation", () => {
    test.each([
      ["PATCH", { startsAt: "invalid" }, 400, "Start date/time is invalid."],
      ["PATCH", { title: "" }, 400, "Title cannot be empty."],
      ["PATCH", { location: "" }, 400, "Location cannot be empty."],
      ["PATCH", { latitude: 50 }, 400, "Latitude and longitude must be provided together."],
      ["PATCH", { latitude: 100, longitude: 0 }, 400, "Latitude and longitude must be valid numbers."],
      ["PATCH", { unknown: "field" }, 400, "No valid fields provided."],
    ])("%s with %j returns %i", async (method, body, status, message) => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({ hostId: 1 }));
      
      const res = await request(testApp).patch("/events/123").send(body);
      expect(res.status).toBe(status);
      expect(res.body.message).toBe(message);
    });
  });
   describe("PATCH /events/id", () => {
    it("should allow updating event details", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent());
      mockPrisma.event.update.mockResolvedValue(createEvent({
        title: "Updated Event",
        description: "Updated description",
      }));
      
      const res = await request(testApp)
        .patch(`/events/123`)
        .send({
          title: "Updated Event",
          description: "Updated description",
        });
        
      expect(res.status).toBe(200);
      expect(res.body.event.title).toBe("Updated Event");
    });
    it("shhould return 403 if not host tries to update", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        hostId: 2, // different host id 
      }));
      
      const res = await request(testApp)
        .patch(`/events/123`)
        .send({
          title: "Updated Event",
          description: "Updated description",
        });
        
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Only the host can update this event!");
    });
    it("should return 401 if user is logged out", async () => {
      loggedOut = true; 
      const res = await request(testApp).patch("/events/123").send({ title: "New" });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized.");
    });
    it("should return 400 if no valid fields are provided to PATCH", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({ hostId: 1 }));
      const res = await request(testApp).patch("/events/123").send({ invalidField: "data" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No valid fields provided.");
    });
    it("stores Other when an unrecognised category string is supplied", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({ hostId: 1 }));
      mockPrisma.event.update.mockResolvedValue(createEvent({ category: "Other", title: "Test Event" }));
  
      const res = await request(testApp)
        .patch("/events/123")
        .send({ category: "NotARealCategory", title: "Test Event" });
  
      expect(res.status).toBe(200);
      expect(res.body.event.category).toBe("Other");
    });
  });
  describe("DELETE /events/id", () => {
    it("should allow host to delete an event", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent());
      mockPrisma.event.delete.mockResolvedValue(createEvent());
      const res = await request(testApp)
        .delete(`/events/123`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Event deleted successfully.");
    });
    it("should return 403 if non-host tries to delete", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(createEvent({
        hostId: 10, // different host id 
      }));
      const res = await request(testApp)
        .delete(`/events/123`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Only the host can delete this event.");
    });
    it("should return 404 when event does not exist", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      const res = await request(testApp).delete("/events/999");
      expect(res.status).toBe(404);
    });
    it("should return 401 if user is logged out", async () => {
      loggedOut = true; 
      const res = await request(testApp).delete("/events/123").send({ title: "New" });
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized.");
    });
  });
});
