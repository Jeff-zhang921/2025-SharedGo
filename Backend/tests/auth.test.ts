//mock environment variables
process.env.LOGIN_CODE_SECRET = "testsecret";
process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "password";
process.env.NODE_ENV = "test";

import request from "supertest";
import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Request, Response, NextFunction } from "express";
const mockPrisma = {
    user: {
            upsert: jest.fn(),
            findFirst: jest.fn(),
        },
    loginCode: {
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    event: {
        findUnique: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
    $disconnect: jest.fn(),
};

//mock prisma client and nodemailer so we can test without hitting the actual database or sending emails
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn (() => mockPrisma),
    Category: {},
}));

jest.mock("nodemailer", () => {
    const mockSendMail = jest.fn().mockResolvedValue(true);
    const mockTransport = { sendMail: mockSendMail };
    return {
        createTransport: jest.fn(() => mockTransport)
    };
});

jest.mock("../src/middleware/requireSession", () => ({
  requireSession: (req: Request, res: Response, next: NextFunction) => next(),
}));

import app from "../src";
import session from "express-session";
import authRouter from "../src/routes/auth";
app.use(express.json());
app.use(session({
    secret: "test",
    saveUninitialized: false,
    resave: false
}));

let sessionSetter: { id: number; email: string; name: string; provider: "email" } | undefined = { 
  id: 123, 
  email: "test@example.com", 
  name: "Test User",
  provider: "email" 
};
let destroyError = false;

app.use((req, res, next) => {
    if (sessionSetter) {
        req.session.user = sessionSetter;
    }
    if (destroyError) {
        req.session.destroy = function(cb) { cb(new Error('test destroy error')); return this; };
    }
    next();
});

app.use("/auth", authRouter);

beforeAll(() => {
    // Clear all mocks before starting tests
    jest.clearAllMocks();
});

beforeEach(() => {
    jest.clearAllMocks();
    sessionSetter = undefined;
});

afterAll(() => {
    jest.resetAllMocks();
}); 

describe("Auth Routes", () => {
    
    describe("POST /auth/email/start", () => {
        it("should return 400 for invalid email format", async () => {
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "invalidemail" });
        
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid email is required.");
        });
        it("should return 500 if nodemailer fails to send email", async () => {
            process.env.NODE_ENV = "production"; //force email sending
            const transport = nodemailer.createTransport();
            (transport.sendMail as jest.Mock).mockRejectedValueOnce(new Error("SMTP connection failed"));
        
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "test@gmail.com"});
            expect(res.status).toBe(500);
            process.env.NODE_ENV = "test"; //restore for other tests
        });

        it("should successfully process valid email and send code", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue(null); // No active code
            mockPrisma.user.findFirst.mockResolvedValue({ name: "Test User" }); // User exists
            mockPrisma.loginCode.create.mockResolvedValue({}); // Mock code creation
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "valid@gmail.com" });
            
            if (res.status === 500) {
                console.log("Error", res.body.message);
            }
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Verification code sent.");
        });
        it ("should send code if no active code exists", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue(null);
            mockPrisma.user.findFirst.mockResolvedValue({ name: "Tester"}); // User exists
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "test@gmail.com"});
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Verification code sent.");
        });

        it("should return 429 if an active code already exists", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue({ 
                id: "active-123",
                email: "test@gmail.com",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
            });
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "test@gmail.com"});
            expect(res.status).toBe(429);
            expect(res.body.message).toContain("already active");
        });
    });
    describe("POST /auth/email/verify", () => {
        it("should return 401 for incorrect code", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue({
                id: "code-123",
                codeHash: "hashedcode",
                attempt: 0,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // valid for 5 minutes
            });
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            
            expect(res.status).toBe(401);
            expect(mockPrisma.loginCode.update).toHaveBeenCalledWith({
                where: { id: "code-123" },
                data: { attempts: { increment: 1 } },
            });
        });
        it("should return 401 for expired code", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue(null); // No valid code found
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            expect(res.status).toBe(401);
        });
        it("should return 429 after 5 failed attempts", async () => {
            mockPrisma.loginCode.findFirst.mockResolvedValue({
                id: "code-123",
                codeHash: "hashedcode", 
                attempts: 5,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // valid for 5 minutes
            });
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            expect(res.status).toBe(429);
            expect(res.body.message).toBe("Too many attempts. Request a new code.");
        });
        it("should return 200 and set session for correct code", async () => {  
            const validHash = crypto
                .createHmac("sha256", "testsecret")
                .update("123456")
                .digest("hex");
            mockPrisma.loginCode.findFirst.mockResolvedValue({
                id: "code-123",
                codeHash: validHash,
                attempts: 0,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // valid for 5 minutes
            });
            mockPrisma.user.upsert.mockResolvedValue({
                id: "1",
                email: "test@gmail.com",
                name: "Tester"
            });
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Logged in.");
            expect(res.body.user.email).toBe("test@gmail.com");
        });
        it("should return 400 if code is missing or not string", async () => {
            const res = await request(app)
                .post("/auth/email/verify")
                .send({email: "test@gmail.com", code: ""}); //empty string
            expect(res.status).toBe(400);
        });
    
        it("should use fallback name during upsert if user name is missing", async () => {
            const validHash = crypto
                .createHmac("sha256", "testsecret")
                .update("123456")
                .digest("hex");
            mockPrisma.loginCode.findFirst.mockResolvedValue({
                id: "code-123",
                codeHash: validHash,
                attempts: 0,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
            });
            mockPrisma.user.upsert.mockResolvedValue({
                id: "1",
                email: "test@gmail.com",
                name: null 
            });
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            expect(res.status).toBe(200);
        });
        
    });
    it("should return 401 for /me if not authenticated", async () => {
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Not authenticated.");
    });
    it("should return user info if authenticated", async () => {
        sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({ id: 1, email: "test@gmail.com", name: "Tester", provider: "email" });
        sessionSetter = undefined;
    });
    it("should successfully log out", async () => {
        const res = await request(app).post("/auth/logout");
        expect(res.status).toBe(204);
    });
    it("should return 500 if logout fails", async () => {
        destroyError = true;
        const res = await request(app).post("/auth/logout");
        expect(res.status).toBe(500);
        destroyError = false;
    });
    describe("POST /auth/events/:eventId/participants/email", () => {
        const mockEventId = 123;

        it("should return 401 if user is not in session", async () => {
            // sessionSetter is undefined
            const res = await request(app).post(`/auth/events/${mockEventId}/participants/email`);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is not the host", async () => {
            sessionSetter = { id: 2, email: "other@gmail.com", name: "Other", provider: "email" };
            mockPrisma.event.findUnique.mockResolvedValue({
                id: mockEventId,
                hostId: 999, // Different ID
            });

            const res = await request(app)
                .post(`/auth/events/${mockEventId}/participants/email`);

            expect(res.status).toBe(403);
        });

        it("should send participant list successfully", async () => {
            sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
            const mockStartsAt = new Date();
            mockPrisma.event.findUnique.mockResolvedValue({
                id: mockEventId,
                title: "Test Event",
                location: "Test Venue",
                startsAt: mockStartsAt,
                hostId: 1, // Matches session user
                participants: [
                    { user: { email: "p1@test.com" } },
                    { user: { email: "p2@test.com" } }
                ]
            });

            const res = await request(app)
                .post(`/auth/events/${mockEventId}/participants/email`);
            
            expect(res.status).toBe(200);
            expect(res.body.participantCount).toBe(2);
        });

        it("should handle empty participant list", async () => {
            sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
            mockPrisma.event.findUnique.mockResolvedValue({
                id: mockEventId,
                title: "Empty Event",
                location: "Nowhere",
                startsAt: new Date(),
                hostId: 1,
                participants: []
            });

            const res = await request(app).post(`/auth/events/${mockEventId}/participants/email`);
            expect(res.status).toBe(200);
        });
        it("should return 400 for invalid event id", async () => {
            sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
            const res = await request(app).post(`/auth/events/invalid/participants/email`);
            expect(res.status).toBe(400);
        });

        it("should return 404 if event not found", async () => {
            sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
            mockPrisma.event.findUnique.mockResolvedValue(null);
            const res = await request(app).post(`/auth/events/999/participants/email`);
            expect(res.status).toBe(404);
        });

        it("should return 500 if sending participant email fails", async () => {
            sessionSetter = { id: 1, email: "test@gmail.com", name: "Tester", provider: "email" };
            const mockStartsAt = new Date();
            mockPrisma.event.findUnique.mockResolvedValue({
                id: mockEventId,
                title: "Test Event",
                location: "Test Venue",
                startsAt: mockStartsAt,
                hostId: 1,
                participants: []
            });
            const transport = nodemailer.createTransport();
            (transport.sendMail as jest.Mock).mockRejectedValueOnce(new Error("Send failed"));
            const res = await request(app).post(`/auth/events/${mockEventId}/participants/email`);
            expect(res.status).toBe(500);
        });    
    });
});
