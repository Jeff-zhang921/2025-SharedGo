import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { Session } from "express-session"

const mockUploadFiles = jest.fn();

jest.mock("uploadthing/server", () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    uploadFiles: mockUploadFiles,
  })),
  UTFile: jest.fn().mockImplementation((parts, name, options) => ({
    parts, name, options
  })),
}));

import uploadRouter from "../src/api/upload";
const testApp = express();
testApp.use(express.json());

let loggedIn = true;
let missingEnv = false;

testApp.use((req: Request, res: Response, next: NextFunction) => {
  // Simulate missing env vars for the specific test case
  if (!missingEnv) {
    process.env.UPLOADTHING_TOKEN = "test-token";
  } else {
    delete process.env.UPLOADTHING_TOKEN;
    delete process.env.UPLOADTHING_SECRET_KEY;
  }

  req.session = (loggedIn 
    ? { user: { id: 1 } } 
    : {}) as Session;
  next();
});

testApp.use("/", uploadRouter);

describe("Upload Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loggedIn = true;
    missingEnv = false;
  });

  it("should return 400 if no file is uploaded", async () => {
    const res = await request(testApp).post("/upload");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No file uploaded");
  });
  it("should return 500 if UploadThing env vars are missing", async () => {
    missingEnv = true;
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.txt");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Server misconfiguration: missing UploadThing token");
  });
  it("should return 401 if user is not logged in", async () => {
    loggedIn = false;
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.txt");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
  it("should return 400 if file type is not image or video", async () => {
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.txt");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Only image and video files are allowed");
  });
  it("should upload file and return URL on success", async () => {
    mockUploadFiles.mockResolvedValue({
      data: {
        ufsUrl: "https://example.com/test.jpg",
      },
    });
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.jpg");
    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://example.com/test.jpg");
  });
  it("should return 500 if UploadThing API returns an error", async () => {
    mockUploadFiles.mockResolvedValue({
      error: "Upload failed",
    });
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.jpg");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to upload file");
  });
  it("should return 500 if UploadThing API returns no URL", async () => {
    mockUploadFiles.mockResolvedValue({
      data: {},
    });
    const res = await request(testApp)
      .post("/upload")
      .attach("file", Buffer.from("test file content"), "test.jpg");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to upload file");
  });
});
