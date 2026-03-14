import request from "supertest";
import express from "express";

const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  event: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
  
};

//define Enum for the mock
const mockCategory = {
  PHYSICAL_ACTIVITIES: "Physical Activities",
  FESTIVALS: "Festivals",
  EDUCATIONAL: "Educational",
  NETWORKING: "Networking",
  ARTS_CULTURE: "Arts & Culture",
  FOOD_DRINK: "Food & Drink",
  MUSIC_CONCERTS: "Music & Concerts",
  TECH_GAMING: "Tech & Gaming",
  WELLNESS_MEDITATION: "Wellness & Meditation",
  VOLUNTEER_CHARITY: "Volunteer & Charity",
  OTHER: "Other"
};
// Replace the real PrismaClient export with our mock implementation.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: mockCategory,
}));

import app from "../src";
import hostsRouter from "../src/routes/hosts";
app.use(express.json());
app.use("/hosts", hostsRouter);

const hostId = 1;

const mockHost = {
    id: hostId,
    name: "Host",
    email: "host@gmail.com",
};

const mockEvent = {
      id: 123,
      title: "Test Event",
      description: "This is a test event",
      startsAt: new Date("2024-12-31T22:00:00.000Z"),
      capacity: 50,
      category: "Other",
      location: "Test Location",
      latitude: 0,
      longitude: 0,
      hostId: 1,
      host: {
        id: 1,
        email: "host@example.com",
        name: null,
      },
      participants: [],
      reviews: [],
};

const mockReview = {
    id: 1,
    rating: 3,
    comment: "I really enjoyed it!",
    eventId: 123,
    hostId: 1,
    authorid: 100,
    createdAt: new Date("2026-03-01T10:00:00Z"),
};

beforeAll(() => {
    // Clear all mocks before starting tests
    jest.clearAllMocks();
});

afterAll(() => {
    jest.resetAllMocks();
}); 

describe("Hosts Routes", () => {
    
    describe("GET /hosts/:hostId/overview", () => {
        it("should return 404 for non-existent host", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const res = await request(app)
                .get(`/hosts/${hostId}/overview`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Host not found.");
        });

        it("should return 400 for invalid ID format", async () => {
            const res = await request(app).get("/hosts/notnumber/overview");
            expect(res.status).toBe(400);
        });

        it("should return valid overview ", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockPrisma.event.findMany
                .mockResolvedValueOnce([mockEvent]) //upcomingEvents
                .mockResolvedValueOnce([])          //pastEvents
                .mockResolvedValueOnce([mockEvent]); // eventsForStats
            mockPrisma.event.count  
                .mockResolvedValueOnce(1) //total upcoming
                .mockResolvedValueOnce(0); //total past
            mockPrisma.review.findMany.mockResolvedValue([]);  //recent reviews
            const res = await request(app)
                .get(`/hosts/${hostId}/overview`);
            expect(res.status).toBe(200);
            expect(res.body.host.id).toBe(hostId);
            expect(res.body.stats.upcomingCount).toBe(1);
        });
    });
});
