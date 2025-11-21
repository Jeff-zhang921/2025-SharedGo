import { Router } from "express";
import { PrismaClient } from "../generated/prisma";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const parsePageSize = (raw: unknown, fallback = DEFAULT_PAGE_SIZE): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : Math.floor(parsed);
};

const parsePage = (raw: unknown): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 1) return 1;
  return Math.floor(parsed);
};

const mapEventSummary = (event: {
  id: number;
  title: string;
  startsAt: Date;
  capacity: number | null;
  location: string;
  participants: { joinedAt: Date }[];
}) => {
  const attendeeCount = event.participants.length;
  const seatsRemaining =
    typeof event.capacity === "number"
      ? Math.max(event.capacity - attendeeCount, 0)
      : null;

  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    capacity: event.capacity,
    location: event.location,
    attendeeCount,
    seatsRemaining,
  };
};

const mapReview = (review: {
  id: number;
  rating: number | null;
  comment: string | null;
  createdAt: Date;
  author: { id: number; name: string | null; email: string };
  event: { id: number; title: string; startsAt: Date };
}) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  author: {
    id: review.author.id,
    name: review.author.name,
    email: review.author.email,
  },
  event: {
    id: review.event.id,
    title: review.event.title,
    startsAt: review.event.startsAt,
  },
});

// Overview for Host tab (upcoming/past previews + stats + recent reviews).
router.get("/:hostId/overview", async (req, res) => {
  const hostId = Number(req.params.hostId);
  if (!Number.isInteger(hostId)) {
    res.status(400).json({ message: "Host id must be a number." });
    return;
  }

  const host = await prisma.user.findUnique({ where: { id: hostId } });
  if (!host) {
    res.status(404).json({ message: "Host not found." });
    return;
  }

  const now = new Date();
  const previewLimit = 5;

  const [
    upcomingEvents,
    pastEvents,
    totalUpcoming,
    totalPast,
    eventsForStats,
    recentReviews,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { hostId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: previewLimit,
      include: { participants: true },
    }),
    prisma.event.findMany({
      where: { hostId, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: previewLimit,
      include: { participants: true },
    }),
    prisma.event.count({ where: { hostId, startsAt: { gte: now } } }),
    prisma.event.count({ where: { hostId, startsAt: { lt: now } } }),
    prisma.event.findMany({
      where: { hostId },
      include: { participants: true, reviews: true },
    }),
    prisma.review.findMany({
      where: { hostId },
      include: { author: true, event: true },
      orderBy: { createdAt: "desc" },
      take: previewLimit,
    }),
  ]);

  const totalAttendees = eventsForStats.reduce(
    (sum, event) => sum + event.participants.length,
    0,
  );
  const capacityTotal = eventsForStats.reduce(
    (sum, event) => sum + (event.capacity ?? 0),
    0,
  );
  const averageFillRate =
    capacityTotal > 0
      ? Number((totalAttendees / capacityTotal).toFixed(2))
      : null;

  const allRatings = eventsForStats
    .flatMap((event) => event.reviews)
    .map((review) => review.rating)
    .filter((value): value is number => typeof value === "number");
  const averageRating =
    allRatings.length > 0
      ? Number(
          (allRatings.reduce((sum, value) => sum + value, 0) / allRatings.length).toFixed(2),
        )
      : null;

  res.json({
    host: {
      id: host.id,
      name: host.name,
      email: host.email,
    },
    stats: {
      totalEvents: eventsForStats.length,
      upcomingCount: totalUpcoming,
      pastCount: totalPast,
      totalAttendees,
      averageFillRate,
      averageRating,
      reviewCount: allRatings.length,
    },
    upcomingEvents: upcomingEvents.map(mapEventSummary),
    pastEvents: pastEvents.map(mapEventSummary),
    reviews: recentReviews.map(mapReview),
  });
});


export default router;
