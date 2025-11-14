import request from "supertest";

// Mock Prisma client
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
  },
  $disconnect: jest.fn(),
};

// Mock the PrismaClient
jest.mock("../src/generated/prisma", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

import app from "../src/index";

afterAll(async () => {
  await mockPrisma.$disconnect();
});

describe("Event API", () => {
  let eventId: number;

  it("should create a new event", async () => {
    // Mock user upsert
    mockPrisma.user.upsert.mockResolvedValue({
      id: 1,
      email: "host@sharedgo.dev",
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
        email: "host@sharedgo.dev",
        name: null,
      },
      participants: [],
    };

    mockPrisma.event.create.mockResolvedValue(mockEvent);

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
        hostEmail: "host@sharedgo.dev",
      });

    console.log('Create Event Response:', res.status, res.body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Event created successfully.");
    expect(res.body.event).toHaveProperty("id", 123);
    expect(res.body.event.title).toBe("Test Event");
    expect(res.body.event.host.email).toBe("host@sharedgo.dev");

    eventId = res.body.event.id;
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/events/create")
      .send({
        // Missing title, startsAt, location, hostEmail
        description: "This is a test event",
        capacity: 50,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should join an event", async () => {
    // Mock event exists
    mockPrisma.event.findUnique.mockResolvedValue({
      id: eventId,
      title: "Test Event",
      capacity: 50,
      participants: [],
      host: {
        id: 1,
        email: "host@sharedgo.dev",
        name: null,
      },
    });

    // Mock participant creation
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

    console.log('Join Event Response:', res.status, res.body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Joined the event successfully.");
    expect(res.body.attendee).toHaveProperty("email", "user@example.com");
  });

  it("should not allow joining with missing email", async () => {
    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        name: "Test User",
        // Missing email
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Email is required to join the event.");
  });

  it("should not allow joining non-existent event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/events/9999/join")
      .send({
        email: "user@example.com",
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Event not found.");
  });

  it("should not allow joining a full event", async () => {
    // Mock full event
    mockPrisma.event.findUnique.mockResolvedValue({
      id: eventId,
      title: "Test Event",
      capacity: 1,
      participants: [
        {
          user: {
            email: "existing@example.com",
          },
        },
      ],
      host: {
        id: 1,
        email: "host@sharedgo.dev",
        name: null,
      },
    });

    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        email: "newuser@example.com",
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message", "Event is already full.");
  });

  it("should return already joined message for duplicate participation", async () => {
    // Mock event with existing participant
    mockPrisma.event.findUnique.mockResolvedValue({
      id: eventId,
      title: "Test Event",
      capacity: 50,
      participants: [
        {
          user: {
            email: "user@example.com",
          },
        },
      ],
      host: {
        id: 1,
        email: "host@sharedgo.dev",
        name: null,
      },
    });

    const res = await request(app)
      .post(`/events/${eventId}/join`)
      .send({
        email: "user@example.com",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "You have already joined this event.");
  });

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
        email: "host@sharedgo.dev",
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

    const res = await request(app)
      .get(`/events/${eventId}`);

    console.log('Get Event Response:', res.status, res.body);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.title).toBe("Test Event");
    expect(res.body.description).toBe("This is a test event");
    expect(res.body.location).toBe("Test Location");
    expect(res.body.host.email).toBe("host@sharedgo.dev");
    expect(res.body.attendees).toHaveLength(1);
    expect(res.body.attendees[0].email).toBe("user@example.com");
    expect(res.body.attendeeCount).toBe(1);
    expect(res.body.seatsRemaining).toBe(49);
  });

  it("should return 404 for non-existent event when getting details", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/events/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Event not found.");
  });

  it("should return 400 for invalid event ID format", async () => {
    const res = await request(app)
      .get("/events/not-a-number");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Event id must be a number.");
  });
});