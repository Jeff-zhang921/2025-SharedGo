import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { Session } from "express-session"

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    chatThread: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    chatMessage: {
        findMany: jest.fn(),
    },  
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

import chatRouter from "../src/routes/chat";
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

testApp.use("/chat", chatRouter);

describe("Chat route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        loggedOut = false;
    });
    
    describe("POST /threads", () => {
        it("should return 401 if user is not logged in", async () => {
            loggedOut = true;
            const res = await request(testApp)
                .post("/chat/threads")
                .send({hostId: 2});
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Unauthorized");
        });
        it("should return 400 if user tries to chat with themselves", async () => {
            const res = await request(testApp)
                .post("/chat/threads")
                .send({ hostId: 1}) //same as logged in user
            
                expect(res.status).toBe(400);
                expect(res.body.message).toBe("Cannot create thread with yourself");
        });
        it("should return 404 if host user does't exist", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const res = await request(testApp)
                .post("/chat/threads")
                .send({ hostId: 999}); 
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Host not found");
        });
        it("should create new thread if it doesn't exist", async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 2});
            mockPrisma.chatThread.findFirst.mockResolvedValue(null);
            mockPrisma.chatThread.create.mockResolvedValue({id: 102});
            const res = await request(testApp)
                .post("/chat/threads")
                .send({ hostId: 2});
            expect(res.status).toBe(200);
            expect(res.body.threadId).toBe(102);
        });
    });
    describe("GET /threads", () => {
        it("should return list of threads for logged-in user", async () => {
            mockPrisma.chatThread.findMany.mockResolvedValue([
                {
                    id: 101,
                    hostId: 1,
                    guestId: 2,
                    Messages: []
                }
            ]);
            const res = await request(testApp)
                .get("/chat/threads");
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(101);
        });
        it("should return messages if user is authorized", async () => {
            mockPrisma.chatThread.findUnique.mockResolvedValue({
                id: 50,
                hostId: 1, 
                guestId: 2
            });
            mockPrisma.chatMessage.findMany.mockResolvedValue([
                {
                    id: 1,
                    body: "Hello!"
                }
            ]);
            const res = await request(testApp)
                .get("/chat/threads/50/messages");
            expect(res.status).toBe(200);
            expect(res.body[0].body).toBe("Hello!");
        });
         it("should return 400 if threadId is not valid integer", async () => {
            const threadId = ["abc", "-1" ,"0", "1.5"];
            const res = await request(testApp)
                .get(`/chat/threads/${threadId}/messages`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid threadId is required");
        });
        it("should return 404 if thread doesn't exist", async () => {
            mockPrisma.chatThread.findUnique.mockResolvedValue(null);
            const res = await request(testApp)
                .get("/chat/threads/999/messages");
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Thread not found");
        });
         it("should return 403 if user is not part of the thread", async() => {
            mockPrisma.chatThread.findUnique.mockResolvedValue({
                id: 50,
                hostId: 2,
                guestId: 3
            });
            const res = await request(testApp)
                .get("/chat/threads/50/messages");
            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Forbidden");
        });
    });
    describe("GET /users" , () => {
        it("should return 401 if user is not logged in", async () => {
            loggedOut= true
            const res = await request(testApp).get("/chat/users");
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Unauthorized");
        });
        it("should filter users, case insensitive", async () => {
            const query = "alice";
            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 2,
                    name: "Alice",
                    email: "alice@example.com"
                }
            ]);
            const res = await request(testApp)
                .get(`/chat/users?query=${query}`);
            expect(res.status).toBe(200);
        });
    });
})
