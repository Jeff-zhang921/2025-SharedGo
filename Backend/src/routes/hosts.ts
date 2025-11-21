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


export default router;
