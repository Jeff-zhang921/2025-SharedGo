import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
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
        update: jest.fn(),
    },
    chatMessage: {
        findMany: jest.fn(),
        create: jest.fn(),
    },  
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {},
}));

jest.mock("../src/session", () => ({
  sessionMiddleware: (req: Request, res: Response, next: NextFunction): void => {
    req.session = { 
      user: { 
        id: 1, 
        name: "Test User" 
      },
      save: (cb?: (err?: unknown) => void) => cb?.(),
      destroy: (cb?: (err?: unknown) => void) => cb?.(),
    } as unknown as Session;
    next();
  },
}));

import { initSocket } from "../src/socket"; 

describe("Socket.IO ", () => {
  let httpServer: HttpServer;
  let clientSocket: ClientSocket;
  let port: number;
  //start server
  beforeAll((done) => {
    httpServer = createServer();
    initSocket(httpServer);
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });
  //shut down server after all tests are done
  afterAll((done) => {
    httpServer.close();
    done();
  });
  //reset mocks and create a new client socket before each test
  beforeEach((done) => {
    jest.clearAllMocks();
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ["websocket"], 
      forceNew: true,
      withCredentials: true,
      extraHeaders: {
        "Cookie": "connect.sid=mock-session-id"
      },
    });
    clientSocket.on("connect", () => {
      done();
    });
  });
  //disconnect client socket and clear mocks after each test
  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    jest.clearAllMocks();
  });

  it("should block joining a thread if the user is not a member", (done) => {
    mockPrisma.chatThread.findUnique.mockResolvedValue({
      id: 100,
      hostId: 2,
      guestId: 3,
    });

    clientSocket.emit("thread:join", { threadId: 100 });

    clientSocket.on("chat:error", (msg) => {
      expect(msg).toBe("You are not a member of this thread.");
      done();
    });
  });

  it("should allow a member to send a message", (done) => {
    const threadId = 100;
    const messageBody = "Hello World";
    const mockMsg = {
      id: 500,
      threadId,
      senderId: 1,
      body: messageBody,
      createdAt: new Date(),
    };

    mockPrisma.chatThread.findUnique.mockResolvedValue({
      id: threadId,
      hostId: 1, // User is the host
      guestId: 2,
    });

    mockPrisma.chatMessage.create.mockResolvedValue(mockMsg);
    mockPrisma.chatThread.update.mockResolvedValue({});

    //First join 
    clientSocket.emit("thread:join", { threadId });

    //Listen for the new message event
    clientSocket.on("message:new", (data) => {
      expect(data.body).toBe(messageBody);
      expect(data.senderId).toBe(1);
      expect(mockPrisma.chatMessage.create).toHaveBeenCalled();
      done();
    });

    //Send the message
    clientSocket.emit("message:send", { threadId, body: messageBody });
  });

  it("should return an error for empty message bodies", (done) => {
    mockPrisma.chatThread.findUnique.mockResolvedValue({ id: 1, hostId: 1, guestId: 2 });

    clientSocket.emit("message:send", { threadId: 1, body: "   " });

    clientSocket.on("chat:error", (msg) => {
      expect(msg).toBe("Message body must be a non-empty string.");
      done();
    });
  });

  it("should assign 'guest' role if user is the guestId", (done) => {
    mockPrisma.chatThread.findUnique.mockResolvedValue({
      id: 101,
      hostId: 99, // Someone else is host
      guestId: 1,  // Current user is guest
    });
    clientSocket.emit("thread:join", 101); 
    clientSocket.emit("message:send", { threadId: 101, body: "I am the guest" });
    clientSocket.on("message:new", (data) => {
      expect(data.body).toBe("Hello World");
      done();
    });
  });
});
