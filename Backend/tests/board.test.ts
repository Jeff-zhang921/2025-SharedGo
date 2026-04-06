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
    describe("GET /qna/:eventId", () => {
        it("should allow a participant to view Q&A", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue({ eventId: 1 });
            mockPrisma.question.findMany.mockResolvedValue([]);

            const res = await request(testApp).get("/board/qna/1");
            expect(res.status).toBe(200);
        });
        it("should deny access if user is neither host nor participant", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue(null);
            const res = await request(testApp).get("/board/qna/1");
            expect(res.status).toBe(403);
        });
        it("should return 404 if event not found", async () => {
            mockPrisma.event.findUnique.mockResolvedValue(null);
            const res = await request(testApp).get("/board/qna/1");
            expect(res.status).toBe(404);
        });
    });
    describe("POST /qna/:eventId/questions", () => {
        it("should allow a participant to post a question", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue({ eventId: 1 });
            mockPrisma.question.create.mockResolvedValue({ id: 1, body: "Test question" });
            const res = await request(testApp)
                .post("/board/qna/1/question")
                .send({ body: "Test question" });
            expect(res.status).toBe(201);
            expect(mockPrisma.question.create).toHaveBeenCalled();
        });
        it("should return 403 if non-participant tries to post a question", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue(null);
            const res = await request(testApp)
                .post("/board/qna/1/question")
                .send({ body: "Test question" });
            expect(res.status).toBe(403);
        });
        it("should return 400 if answer is longer than 1000 character", async () => {
            const res = await request(testApp)
                .post("/board/qna/1/question")
                .send({ questionId: 1, body: "a".repeat(1001) });
            expect(res.status).toBe(400);
        });
        it("should return 500 if database fails during POST question", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ hostId: 1 });
            mockPrisma.question.create.mockRejectedValue(new Error("Insert failed"));

            const res = await request(testApp)
                .post("/board/qna/1/question")
                .send({ body: "Valid question" });

            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Failed to post question to Q&A board");
        });
    });
    describe("POST /qna/:eventId/answer", () => {
        it("should allow only host and participant to post an answer", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue({ eventId: 1 });
            mockPrisma.question.findUnique.mockResolvedValue({ id: 1, eventId: 1 });
            mockPrisma.answer.create.mockResolvedValue({ id: 1, body: "Test answer" });
            const res = await request(testApp)
                .post("/board/qna/1/answer")
                .send({ questionId: 1, body: "Test answer" });

            expect(res.status).toBe(201);
            expect(mockPrisma.answer.create).toHaveBeenCalled();
        });
        it("should return 403 if non-participant tries to post an answer", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 2 });
            mockPrisma.eventParticipant.findUnique.mockResolvedValue(null);
            const res = await request(testApp)
                .post("/board/qna/1/answer")
                .send({ questionId: 1, body: "Test answer" });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Only the event host and participants can post answers to the Q&A board");
        });
        it("should return 404 if question belongs to another event", async () => {
            mockPrisma.event.findUnique.mockResolvedValue({ id: 1, hostId: 1 });
            // Mock a question that exists, but has eventId: 999
            mockPrisma.question.findUnique.mockResolvedValue({ id: 5, eventId: 999 });

            const res = await request(testApp)
                .post("/board/qna/1/answer")
                .send({ questionId: 5, body: "test" });

            expect(res.status).toBe(404);
        });
        it("should return 400 if answer is too long", async () => {
            const res = await request(testApp)
                .post("/board/qna/1/answer")
                .send({ questionId: 1, body: "a".repeat(1001) });
            expect(res.status).toBe(400);
        });
        it("should return 400 if answer body is empty", async () => {
            const res = await request(testApp)
                .post("/board/qna/1/answer")
                .send({ questionId: 1, body: "  " });
            expect(res.status).toBe(400);
        });
    });
});

