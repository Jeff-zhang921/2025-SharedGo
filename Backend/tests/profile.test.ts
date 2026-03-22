import request from "supertest";
import express from "express";
import session from "express-session";
import { Request, Response, NextFunction } from "express";

const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
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

// Replace the real PrismaClient export with our mock implementation.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

jest.mock("../src/middleware/requireSession", () => ({
  requireSession: (req: Request, res: Response, next: NextFunction) => next(),
}));

import profileRouter from "../src/routes/profile";


const testApp = express();
testApp.use(express.json());
//session mock
testApp.use(session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: true,
}));

interface SessionUser {
  id: number;
  name: string | null;
  email: string;
  provider: "email";
}

let mockUser: SessionUser | null = null;
testApp.use((req, res, next) => {
    if(mockUser) {
        req.session.user = mockUser;
    } else {
        delete req.session.user;
    }
    next();
});
testApp.use("/", profileRouter);

const mockEvent = (overrides = {}) => ({
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
      host: { id: 1, name: "Host", email: "host@gmail.com"},
      participants: [{ userId: 1, joinedAt: new Date() }],
      reviews: [] as { rating: number | null }[],
      _count: { participants: 1},
      ...overrides,
});

const mockReview = {
    id: 1,
    rating: 4,
    comment: "Great!",
    eventId: 123,
    createdAt: new Date(),
    author: { id: 1, name: "Test user", email: "user@gmail.com"},
    host: { id: 1, name: "Host", email: "host@gmail.com"},
    event: { id: 123, title: "Test Event"},
};

const mockOverview = ({
    upcomingEvents = [mockEvent()],
    pastEvents = [],
    totalUpcoming = 1,
    totalPast = 0,
    eventsForStats = [mockEvent()],
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


type mockData = Record<string, unknown>; 

const mockPagination = (data: mockData[], total: number) => {
  mockPrisma.event.findMany.mockResolvedValue(data);
  mockPrisma.event.count.mockResolvedValue(total);
  mockPrisma.review.findMany.mockResolvedValue(data);
  mockPrisma.review.count.mockResolvedValue(total);
};

beforeEach(() => {
    // Clear all mocks before starting tests
    jest.clearAllMocks();
});

afterAll(() => {
    jest.resetAllMocks();
}); 

describe("Profile Routes", () => {
    describe("GET /profile/me", () => {
        it("should return 401 if not authenticated", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const res = await request(testApp).get("/me");
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Not authenticated.");
        });

        it("should return user data if authenticated", async () => {
            mockUser = {
                id: 1,
                name: "Test User",
                email: "user@gmail.com",
                provider: "email",
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const res = await request(testApp)
                .get("/me")
            expect(res.status).toBe(200);
        });
        it("should 404 if session exists but user was deleted from DB", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null); // Database returns nothing
            const res = await request(testApp).get("/me");
            expect(res.status).toBe(404);
        });
    });
    describe("PATCH /profile/me", () => {
        it("should update and return new profile name", async () => {
            const updatedUser = {
                id: 1,
                name: "New name",
                email: "user@gmail.com"
            };
            mockPrisma.user.update.mockResolvedValue(updatedUser);
            const res = await request(testApp)
                .patch("/me")
                .send({name: "New mame"});
            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe("New name");
        });
        it("should return 400 if name is not a string or null (e.g., a number)", async () => {
            const res = await request(testApp)
                .patch("/me").send({ name: 12345 });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Name must be a string or null.");
        });
        it("should return 400 if the name field is missing entirely", async () => {
            const res = await request(testApp)
                .patch("/me")
                .send({ otherField: "ignore" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("No fields to update.");
        });
    });
    describe("GET profile/me/overview", () => {
        it("should return profile overview with stats and event previews", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockOverview();
            const res = await request(testApp).get("/me/overview");
            expect(res.status).toBe(200);
            expect(res.body.stats.upcomingCount).toBe(1)
        });
        it("should delete session and return 404 if user is missing from database", async () => {
            mockUser = { id: 999, email: "test@gmail.com", name: null, provider: "email" }; // User is logged in...
            mockPrisma.user.findUnique.mockResolvedValue(null); // ...but DB record is gone

            const res = await request(testApp).get("/me/overview");
        
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("User not found.");
        });
        
    });  
    
});
