import request from "supertest";

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
  },
  eventParticipant: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
  
};

// Replace the real PrismaClient export with our mock implementation.
jest.mock("../src/generated/prisma", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));


// Clear mock call history between tests to ensure isolation.
beforeEach(async () => {
  jest.clearAllMocks();
  await mockPrisma.eventParticipant.deleteMany({});
});
//importing app after mock 
import app from "../src/index";

afterAll(async () => { //disconnect after tests are done
  await mockPrisma.$disconnect();
});

describe("Event API", () => {
  let eventId: number;
  //mock user upsert, need to ensure host user exist before event creation
  it("should create a new event", async () => {
      mockPrisma.user.upsert.mockResolvedValue({
      id: 1,
      email: "host@example.com",
      name: null,
    });

    // Mock event creation
    const mockEvent = {
      id: 123,
      title: "Test Event",
      description: "This is a test event",
      startsAt: new Date("2024-12-31T22:00:00.000Z"),
      capacity: 50,
      location: "Test Location",
      imageUrl: null,
      externalUrl: null,
      hostId: 1,
      host: {
        id: 1,
        email: "host@example.com",
        name: null,
      },
      participants: [],
    };

    mockPrisma.event.create.mockResolvedValue(mockEvent);
    
    //send POST request to create event
    const res = await request(app)
      .post("/events/create")
      .send({
        title: "Test Event",
        description: "This is a test event",
        startsAt: "2024-12-31T22:00:00.000Z",
        capacity: 50,
        location: "Test Location",
        imageUrl: null,
        externalUrl: null,
        hostEmail: "host@example.com",
      });

    console.log('Create Event Response:', res.status, res.body);
  
    expect(res.status).toBe(201);
    eventId = res.body.event.id;
    expect(eventId).toBeDefined();
    expect(res.body).toHaveProperty("message", "Event created successfully.");
    expect(res.body.event.title).toBe("Test Event");
    expect(res.body.event.host.email).toBe("host@example.com");
  });

  // Validation: required fields missing should return 400
  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/events/create")
      .send({
        description: "This is a test event",
        capacity: 50,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  // Joining an event
  it("should join an event", async () => {
    if (!eventId) {
      throw new Error("Event ID not set from creation test");
    }
    mockPrisma.event.findUnique.mockResolvedValue({
      id: eventId,
      title: "Test Event",
      capacity: 50,
      participants: [],
      host: {
        id: 1,
        email: "host@example.com",
        name: null,
      },
    });

    // Mock creation of a participant 
    mockPrisma.eventParticipant.create.mockResolvedValue({
      id: 1,
      eventId: eventId,
      userId: 2,
      joinedAt: new Date(),
      user: {
        id: 2,
        email: "user@example.com",
        name: "Test User",
      },
    });

    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        email: "user@example.com",
        name: "Test User",
      });

    console.log("Join Event Response:", res.status, res.body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Joined the event successfully.");
    expect(res.body.attendee).toHaveProperty("email", "user@example.com");
  });

  // Joining validation missing email should return 400
  it("should not allow joining with missing email", async () => {
    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        name: "Test User",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Email is required to join the event.");
  });

  // Joining a non-existent event should return 404
  it("should not allow joining non-existent event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null); // event not found
    const res = await request(app)
      .post("/events/9999/join")
      .send({
        email: "user@example.com",
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Event not found.");
  });

  // // Joining a full event should return 409 (conflict)
  // it("should not allow joining a full event", async () => {
  //   // Mock full event (capacity 1, already has 1 participant)
  //   mockPrisma.event.findUnique.mockResolvedValue({
  //     id: eventId,
  //     title: "Test Event",
  //     capacity: 1,
  //     participants: [
  //       {
  //         user: {
  //           email: "existing@example.com",
  //         },
  //       },
  //     ],
  
  //     host: {
  //       id: 1,
  //       email: "host@example.com",
  //       name: null,
  //     },
  //   });

  //   const res = await request(app)
  //     .post(`/events/${eventId}/join`)
  //     .send({
  //       email: "newuser@example.com",
  //     });

  //   expect(res.status).toBe(409);
  //   expect(res.body).toHaveProperty("message", "Event is already full.");
  // });

  // Duplicate join attempt 
  it("should return already joined message for duplicate participation", async () => {
    // Mock event where the user is already in the participants list
    mockPrisma.event.findUnique.mockResolvedValue({
      id: eventId,
      title: "Test Event",
      capacity: 50,
      participants: [
        {
          user: {
            email: "user@example.com", // user already joined
          },
        },
      ],
      host: {
        id: 1,
        email: "host@example.com",
        name: null,
      },
    });

    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        email: "user@example.com", // same email trying to join
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "You have already joined this event.");
  });

  // Retrieving event details
  it("should get event details", async () => {
    const mockEvent = {
      id: eventId,
      title: "Test Event",
      description: "This is a test event",
      startsAt: new Date("2024-12-31T22:00:00.000Z"),
      capacity: 50,
      location: "Test Location",
      imageUrl: null,
      externalUrl: null,
      host: {
        id: 1,
        name: "Host User",
        email: "host@example.com",
      },
      participants: [
        {
          joinedAt: new Date(),
          user: {
            id: 2,
            name: "Test User",
            email: "user@example.com",
          },
        },
      ],
    };

    mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

    const res = await request(app).get(`/events/${eventId}`);

    console.log("Get Event Response:", res.status, res.body);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.title).toBe("Test Event");
    expect(res.body.description).toBe("This is a test event");
    expect(res.body.location).toBe("Test Location");
    expect(res.body.host.email).toBe("host@example.com");
    expect(res.body.attendees.length).toBeGreaterThanOrEqual(1);
    expect(res.body.attendees[0].email).toBe("user@example.com");
    expect(res.body.attendeeCount).toBeGreaterThanOrEqual(1);
    expect(res.body.seatsRemaining).toBeLessThanOrEqual(49);
  });

  // Getting a non-existent event should return 404
  it("should return 404 for non-existent event when getting details", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/events/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Event not found.");
  });

  // Invalid event id format should return 400
  it("should return 400 for invalid event ID format", async () => {
    const res = await request(app).get("/events/not-a-number");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Event id must be a number.");
  });
});