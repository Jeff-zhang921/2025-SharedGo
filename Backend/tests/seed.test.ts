const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  event: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  eventParticipant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  review: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

import { main } from "../src/seed"
const mockHost = { id: 1, email: "host@sharego.dev" };
const mockEvent = { id: 10, title: "Community Meetup" };
const mockAttendee = { id: 2, email: "attendee@sharego.dev" };

describe("Seed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create records if they don't exist", async () => {
    mockPrisma.user.upsert.mockResolvedValue(mockHost);
    mockPrisma.event.findFirst.mockResolvedValue(null); 
    mockPrisma.event.create.mockResolvedValue(mockEvent);
    mockPrisma.user.findUnique.mockResolvedValue(null); 
    mockPrisma.user.create.mockResolvedValue(mockAttendee);
    mockPrisma.eventParticipant.findUnique.mockResolvedValue(null); 
    mockPrisma.review.findFirst.mockResolvedValue(null); 

    await main();
    
    expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "host@sharego.dev" } })
    );

    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Community Meetup" }),
      })
    );

    expect(mockPrisma.eventParticipant.create).toHaveBeenCalledWith({
      data: { eventId: 10, userId: 2 },
    });

    expect(mockPrisma.review.create).toHaveBeenCalled();
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
  });

  it("should skip creation if records already exist", async () => {
    mockPrisma.user.upsert.mockResolvedValue(mockHost);
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent); 
    mockPrisma.user.findUnique.mockResolvedValue(mockAttendee); 
    mockPrisma.eventParticipant.findUnique.mockResolvedValue({ id: 100 }); 
    mockPrisma.review.findFirst.mockResolvedValue({ id: 200 }); 

    await main();
    expect(mockPrisma.event.create).not.toHaveBeenCalled();
    expect(mockPrisma.eventParticipant.create).not.toHaveBeenCalled();
    expect(mockPrisma.review.create).not.toHaveBeenCalled();
  });
});
