import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

const mockPrisma = {
    event: {
        findUnique: jest.fn(),
    },
    general: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
    question: { 
        findMany: jest.fn(), 
        findUnique: jest.fn(), 
        create: jest.fn() 
    },
    answer: { 
        create: jest.fn() 
    },
    eventParticipant: { 
        findUnique: jest.fn() 
    },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

import boardRouter from "../src/routes/board";
const testApp = express();
testApp.use(express.json());
let loggedOut = false;
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
testApp.use("/board", boardRouter);

describe("Board route", () => {
     beforeEach(() => {
        jest.clearAllMocks();
        loggedOut = false;
    });
    
     describe("GET /general/:eventId", () => {
        it("should return 400 if valid eventId is not proided", async () => {
            const res = await request(testApp)
                .get("/board/general/abc");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid eventId is required");
        });
        it("should return 404 if event is not found", async () => {
            mockPrisma.event.findUnique.mockResolvedValue(null);
            const res = await request(testApp)
                .get("/board/general/1");
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Event not found");
        });
        it("should return general messages on success", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.general.findMany.mockResolvedValue([{ id: 101, body: "Hello" }]);

            const res = await request(testApp).get("/board/general/1");
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].body).toBe("Hello");
        });
    });
    describe("POST /general/:eventId", () => {
        it("should return 401 if user is not logged in", async () => {
            loggedOut = true;
            const res = await request(testApp)
                .post("/board/general/1")
                .send({ body: "Test message" });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Unauthorized");
        });
        it("should return 400 if valid eventId is not proided", async () => {
            const res = await request(testApp)
                .post("/board/general/abc")
                .send({ body: "Test message" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid eventId is required");
        });
        it("should return 400 if message body is empty", async () => {
            const res = await request(testApp)
                .post("/board/general/1")
                .send({ body: "   " }); //only spaces
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Message body is required");
        });
        it("should allow the host to post a message", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ hostId: 1 }); // Same as mocked session user
            mockPrisma.general.create.mockResolvedValue({ id: 1, body: "Host message" });

            const res = await request(testApp)
                .post("/board/general/1")
                .send({ body: "Host message" });

            expect(res.status).toBe(201);
            expect(mockPrisma.general.create).toHaveBeenCalled();
        });
        it("should return 403 if non-host user tries to post a message", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ hostId: 999 }); // Different from mocked session user
            const res = await request(testApp)
                .post("/board/general/1")
                .send({ body: "Non-host message" });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Only the event host can post messages to the general board");
        });
        it("should return 400 if message body exceeds 1000 characters", async () => {
            const longBody = "a".repeat(1001);
            const res = await request(testApp)
                .post("/board/general/1")
                .send({ body: longBody });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Message body must be less than 1000 characters");
        });
    });
});

