import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";

const mockPrisma = {
  user: {
    findMany: jest.fn() 
  },
  event: {
    findMany: jest.fn(),
  }
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

jest.mock("../src/middleware/requireSession", () => ({
  requireSession: (req: Request, res: Response, next: NextFunction) => next(),
}));

interface CustomSession extends session.Session {
  //user?: { id: number; email: string; name: string | null; provider: string };
  location?: { latitude: number; longitude: number; updatedAt: string };
}
const testApp = express();
testApp.use(express.json());

testApp.use(session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: true,
}));

//let mockUser: any = null;
let mockSession: Partial<CustomSession> = {};
testApp.use((req, res, next) => {
    // if(mockUser) {
    //     req.session.user = mockUser;
    // } 
    if(mockSession.location) {
        req.session.location = mockSession.location;
    }
    next();
});
testApp.use((req: Request, _res: Response, next: NextFunction) => {
    if(req.session.location) {
        mockSession.location = req.session.location;
    }
    next();
});
testApp.use((req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    const loc = (req.session as CustomSession).location;
    if (loc) {
      mockSession.location = loc;
    }
  });
  next();
});
import filterRouter from "../src/routes/filter";
testApp.use("/", filterRouter);


describe("Filter Route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession = {};
    });
    describe("GET /nearby", () => {
        it("should return 400 if no coordinates are provided and session is empty", async () => {
            const res = await request(testApp).get("/nearby");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid lat and long are required");
        });
        it("should return events within 10km and update session", async () => {
            // Event 1: Very close (~1km)
            // Event 2: Very far (>100km)
            const mockEvents = [
                { id: 1, latitude: 51.5074, longitude: -0.1278, participants: [] }, 
                { id: 2, latitude: 40.7128, longitude: -74.0060, participants: [] }
            ];
            mockPrisma.event.findMany.mockResolvedValue(mockEvents);
            const res = await request(testApp)
                .get("/nearby")
                .query({ latitude: 51.5033, longitude: -0.1195 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1); 
            expect(res.body[0].event.id).toBe(1);
            expect(mockSession.location?.latitude).toBe(51.5033);
        });
        it("should return null for Latitude out of range", async () => {
            const res = await request(testApp)
                .get("/nearby")
                .query({ latitude: 91, longitude: 0 });
            expect(res.status).toBe(400);
        });
        it("should return null for Longitude out of range", async () => {
            const res = await request(testApp)
                .get("/nearby")
                .query({ latitude: 0, longitude: -181 });
            expect(res.status).toBe(400);
        });
    });
    describe("GET /search", () => {
        it("should filter by category and attendeeCount", async () => {
            const mockEvents = [
                { title: "Rock Show", category: "Music", participants: [1, 2], startsAt: new Date() },
                { title: "Tech Talk", category: "Tech", participants: [], startsAt: new Date() }
            ];
            mockPrisma.event.findMany.mockResolvedValue(mockEvents);
            const res = await request(testApp)
                .get("/search")
                .query({ category: "Music",attendeeCountMin: "1"});
            expect(res.body[0].event.title).toBe("Rock Show");
        });
        it("should filter by date correctly", async () => {
            const testDate = new Date();
            testDate.setUTCHours(0, 0, 0, 0); 
            const mockEvents = [
                { id: 100, title: "Today", startsAt: testDate, participants: [] }
            ];
            mockPrisma.event.findMany.mockResolvedValue(mockEvents);
            const res = await request(testApp)
                .get("/search")
                .query({ rawdate: testDate.toISOString() });
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].event.title).toBe("Today");
        });
        it("should cover Date and EndDate filter branches (Lines 170-171)", async () => {
            const eventDate = "2026-05-20";
            const res = await request(testApp)
                .get("/search")
                .query({ 
                    rawdate: eventDate,
                    enddate: "2026-05-21" 
                });
            expect(res.status).toBe(200);
        });
    
    });
    describe("GET /name", () => {
        it("should return 400 if name is empty", async () => {
            const res = await request(testApp).get("/name").query({ name: "" });
            expect(res.status).toBe(400);
        });

        it("should return list of host names", async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ name: "Alice" }, { name: "Alex" }]);
            const res = await request(testApp).get("/name").query({ name: "Al" });
            expect(res.body).toEqual(["Alice", "Alex"]);
        });
    });
});
