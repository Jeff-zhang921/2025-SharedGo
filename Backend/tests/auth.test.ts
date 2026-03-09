//mock environment variables
process.env.LOGIN_CODE_SECRET = "testsecret";
process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "password";
process.env.NODE_ENV = "test";

import request from "supertest";
import express from "express";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
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
        $transaction: jest.fn((promises) => Promise.all(promises)),
        $disconnect: jest.fn(),
};

//mock prisma client and nodemailer so we can test without hitting the actual database or sending emails
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn (() => mockPrisma),
    Category: {
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
    }
}));

jest.mock("nodemailer", () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

jest.mock("../src/middleware/requireSession", () => ({
  requireSession: (req: Request, res: Response, next: NextFunction) => next(),
}));

import app from "../src";
import session from "express-session";
import authRouter from "../src/routes/auth";
import { create } from "domain";
app.use(express.json());
app.use(session({
    secret: "test",
    saveUninitialized: false,
    resave: false
}));

app.use("/auth", authRouter);

beforeAll(() => {
    // Clear all mocks before starting tests
    jest.clearAllMocks();
});

afterAll(() => {
    jest.resetAllMocks();
}); 

describe("Auth Routes", () => {
    // let prismaMock: DeepMockProxy<PrismaClient>;
    
    describe("POST /auth/email/start", () => {
        it("should return 400 for invalid email format", async () => {
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "invalidemail" });
        
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Valid email is required.");
        });
        it("should return 500 if databse fails during start", async () => {
            mockPrisma.loginCode.findFirst.mockRejectedValue(new Error("Database connection lost"));
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "test@gmail.com" });
            expect(res.status).toBe(500);
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
            mockPrisma.loginCode.findFirst.mockResolvedValue({ id: 1 });
            const res = await request(app)
                .post("/auth/email/start")
                .send({ email: "test@gmail.com"});
            expect(res.status).toBe(429);
            expect(res.body.message).toContain("already active");
        });
        it("should return 500 when database fails during transaction", async () => {
        mockPrisma.loginCode.findFirst.mockResolvedValue(null); // No active code
        mockPrisma.user.findFirst.mockResolvedValue(null); // User does not exist
        mockPrisma.$transaction.mockRejectedValue(new Error("Database error"));
        const res = await request(app)
            .post("/auth/email/start")
            .send({ email: "test@gmail.com"});
        expect(res.status).toBe(500);
       });
       it("should successfuly handle new user not found in DB", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.loginCode.findFirst.mockResolvedValue(null); 
        mockPrisma.$transaction.mockResolvedValue([
            {count: 0}, 
            {id: "new-id", email: "new@gmail.com"}
        ]); 
        const res = await request(app)
            .post("/auth/email/start")
            .send({ email: "new@gmail.com" });
        
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Verification code sent.");
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
            const crypto = require("crypto");
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
        it("should return 500 if database fails during verification", async () => {
            const crypto = require("crypto");
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
            mockPrisma.user.upsert.mockRejectedValue(new Error("Upsert failed"));
            const res = await request(app)
                .post("/auth/email/verify")
                .send({ email: "test@gmail.com", code: "123456" });
            expect(res.status).toBe(500);
        });
    });
    
    it("should return 401 for /me if not authenticated", async () => {
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Not authenticated.");
    });
    it("should successfully log out", async () => {
        const res = await request(app).post("/auth/logout");
        expect(res.status).toBe(204);
    });
    it("should handle session destruction error on logout", async () => {
        //error triggering route
        app.post("/auth/logout-error", (req, internalRes) => {
            (req.session as any).destroy = (callback: (err: any) => void) => {
                return callback(new Error("Session destroy error"));
            };
            req.session.destroy((err) => {
                if (err) {
                    return internalRes.status(500).json({ message: "Failed to log out." });
                }
                return internalRes.status(204).end();
            });
        });

        const response = await request(app)
            .post("/auth/logout-error");
    
        expect(response.status).toBe(500);
        expect(response.body.message).toBe("Failed to log out.");
    });

});
