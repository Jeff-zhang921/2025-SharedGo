//mock environment variables
process.env.LOGIN_CODE_SECRET = "testsecret";
process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "password";
process.env.NODE_ENV = "test";

import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { mockDeep, DeepMockProxy, mock } from "jest-mock-extended";
//import session from "express-session";


import { PrismaClient } from "@prisma/client";

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

    });
});

    
