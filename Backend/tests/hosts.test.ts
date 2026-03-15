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
      startsAt: new Date(),
      capacity: 100,
      category: "Other",
      location: "Test Location",
      latitude: 0,
      longitude: 0,
      hostId: 1,
      participants: Array(20).fill({ joinedAt: new Date()}),
      reviews: [] as { rating: number | null }[],
};

const mockReview = {
    id: 1,
    rating: 3,
    comment: "Great!",
    eventId: 123,
    hostId: 1,
    createdAt: new Date(),
    author: { id: 100, name: "John", email: "john@gmail.com"},
    event: { id: 123, title: "Test Event"},
};

const mockOverview = ({
    upcomingEvents = [mockEvent],
    pastEvents = [],
    totalUpcoming = 1,
    totalPast = 0,
    eventsForStats = [mockEvent],
    recentReviews = [mockReview],
} = {}) => {
    mockPrisma.event.findMany
        .mockResolvedValueOnce(upcomingEvents) 
        .mockResolvedValueOnce(pastEvents)          
        .mockResolvedValueOnce(eventsForStats); 
    mockPrisma.event.count  
        .mockResolvedValueOnce(totalUpcoming) 
        .mockResolvedValueOnce(totalPast); 
    mockPrisma.review.findMany.mockResolvedValue(recentReviews);
};

const mockPagination = (data: any[], total: number) => {
  mockPrisma.event.findMany.mockResolvedValue(data);
  mockPrisma.event.count.mockResolvedValue(total);
  mockPrisma.review.findMany.mockResolvedValue(data);
  mockPrisma.review.count.mockResolvedValue(total);
};

beforeAll(() => {
    // Clear all mocks before starting tests
    jest.clearAllMocks();
});

afterAll(() => {
    jest.resetAllMocks();
}); 

describe("Hosts Routes", () => {
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
    it("should return 0 for seatsRemaining if event is over-booked", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockHost);
        
        const overbookedEvent = { 
            ...mockEvent, 
            capacity: 10, 
        };
        mockPagination([overbookedEvent], 1);
        const res = await request(app).get(`/hosts/${hostId}/events`);
        expect(res.body.events[0].seatsRemaining).toBe(0);
    });
    describe("GET /hosts/hostId/overview", () => {
        it("should return valid overview ", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockOverview();

            const res = await request(app)
                .get(`/hosts/${hostId}/overview`);
            expect(res.status).toBe(200);
            expect(res.body.host.id).toBe(hostId);
            expect(res.body.stats.upcomingCount).toBe(1);
        });

        it("should compute averageFillRate correctly", async () => {
            //20 participants, 100 capacity -> fill rate 0.2
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockOverview();
            const res = await request(app).get(`/hosts/${hostId}/overview`);
            expect(res.status).toBe(200);
            expect(res.body.stats.averageFillRate).toBe(0.2);
        });
        
        it("should compute averageRating correctly and ignore null ratings", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            const eventWithMixedRatings = {
                ...mockEvent,
                reviews: [
                    { rating: 5 },
                    { rating: null },
                    { rating: 3},
                    { rating: 4},
                ] 
            };
            mockOverview({ eventsForStats: [eventWithMixedRatings] });
            const res = await request(app).get(`/hosts/${hostId}/overview`);
            expect(res.body.stats.averageRating).toBe(4); // (5+3+4)/3=4
            expect(res.body.stats.reviewCount).toBe(3);
        });
    });

    describe("GET /hosts/hostid/events", () => {
        it("should handle 'all' status for events", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockPagination([mockEvent], 1);
            const res = await request(app)
                .get(`/hosts/${hostId}/events`)
                .query({ status: "all" }); //upcoming, past 

            expect(res.status).toBe(200);
            // Verify Prisma 'where' was just { hostId } without the startsAt filter
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hostId }
                })
            );
        });

        it("should return past events with descending order", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockPagination([], 0);
            const res = await request(app)
                .get(`/hosts/${hostId}/events`)
                .query({ status: "past" });

            expect(res.status).toBe(200);
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { startsAt: "desc" }
                })
            );
        });

        it("should calculate 'skip' correctly for page 3", async () => {
            mockPagination([], 0);
            await request(app).get(`/hosts/${hostId}/events`).query({ page: 3, limit: 10 });
            // (3 - 1) * 10 = 20
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 20 })
            );
        });

        it("should limit to MAX_PAGE_SIZE (50)", async () => {
            mockPagination([], 0);
            // Try to request 100 items
            await request(app).get(`/hosts/${hostId}/events`).query({ limit: 100 });

            expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });
    });

    describe("GET /hosts/:hostId/reviews", () => {
        it("should return correctly mapped review", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockHost);
            mockPagination([mockReview], 1);
            const res = await request(app).get(`/hosts/${hostId}/reviews`);
            expect(res.status).toBe(200);
            expect(res.body.reviews[0].author.name).toBe("John");
        });
    });

});
