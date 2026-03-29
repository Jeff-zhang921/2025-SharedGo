import { Request, Response, NextFunction } from "express";
import { requireSession } from "../src/middleware/requireSession";

interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  locals: Record<string, unknown>;
}
describe("Middleware: requireSession", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: MockResponse;
  let nextFunction: NextFunction;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Force NODE_ENV to something else so the "skip" branch isn't taken
    process.env.NODE_ENV = "development"; 
    
    nextFunction = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    } as MockResponse;
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should return 401 if no user is in session", () => {
    mockRequest = { session: {} as unknown as Request["session"]};

    requireSession(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Not authenticated." });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should inject email and name into body if they exist", () => {
    const user = { id: 1, email: "test@gmail.com", name: "Tester" };
    mockRequest = { 
      session: { user } as unknown as Request["session"],
      body: {} // Empty body
    };

    requireSession(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    // Verify injections
    expect(mockRequest.body.email).toBe(user.email);
    expect(mockRequest.body.hostEmail).toBe(user.email);
    expect(mockRequest.body.name).toBe(user.name);
    expect(mockResponse.locals.sessionUser).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should initialize req.body if it is missing or null", () => {
    mockRequest = { 
      session: { user: { email: "test@gmail.com" } },
      body: null // Testing the !req.body branch
    } as unknown as Request;

    requireSession(mockRequest as Request, mockResponse as unknown as Response, nextFunction);

    expect(mockRequest.body).toBeDefined();
    expect(mockRequest.body.email).toBe("test@gmail.com");
  });

  it("should skip all logic if NODE_ENV is test", () => {
    process.env.NODE_ENV = "test";
    mockRequest = { session: {} } as unknown as Request; // No user, should 401 usually

    requireSession(mockRequest as Request, mockResponse as unknown as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled(); // Skipped to next()
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});