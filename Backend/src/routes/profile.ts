//me page
import { NextFunction, Request, Response, Router } from "express";
import { Category, Prisma, PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

//convert unknown to number but with maximum
//how many item per page
const parsePageSize = (raw: unknown, fallback = DEFAULT_PAGE_SIZE): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : Math.floor(parsed);
};

//convert unknown to number but minimum is 1 
//which page number
const parsePage = (raw: unknown): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 1) return 1;
  return Math.floor(parsed);
};




type EventProfileRow = {
  id: number;
  title: string;
  startsAt: Date;
  capacity: number | null;
  category: Category;
  location: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  externalUrl: string | null;
  hostId: number;
  host: { id: number; name: string | null; email: string };
  //type[]
  participants: { userId: number; joinedAt: Date }[];

  //expect an object here with a number inside
  //an object contain number of participant
  //count the participants number. if later have more field in _count you can refer by _count.comments
  _count: { participants: number };
};


const mapEventSummary = (event: EventProfileRow, currentUserId: number) => {
    
  const attendeeCount = event._count.participants;

  const seatsRemaining =
    typeof event.capacity === "number" ? Math.max(event.capacity - attendeeCount, 0) : null;

  const attendance = event.participants[0];

  const joinedAt = attendance ? attendance.joinedAt : null;
  const isAttendee = Boolean(attendance);
  const isHost = event.hostId === currentUserId;

  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    capacity: event.capacity,
    seatsRemaining,
    category: event.category,
    location: event.location,
    latitude: event.latitude,
    longitude: event.longitude,
    imageUrl: event.imageUrl,
    externalUrl: event.externalUrl,
    attendeeCount,
    host: {
      id: event.hostId,
      name: event.host.name,
      email: event.host.email,
    },
    isHost,
    isAttendee,
    joinedAt,
  };
};

