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


type ReviewProfileRow = {
  id: number;
  rating: number | null;
  comment: string | null;
  createdAt: Date;
  author: { id: number; name: string | null; email: string };
  host: { id: number; name: string | null; email: string };
  event: { id: number; title: string; startsAt: Date };
};

const mapReview = (review: ReviewProfileRow) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  author: {
    id: review.author.id,
    name: review.author.name,
    email: review.author.email,
  },
  host: {
    id: review.host.id,
    name: review.host.name,
    email: review.host.email,
  },
  event: {
    id: review.event.id,
    title: review.event.title,
    startsAt: review.event.startsAt,
  },
});

//middleware request session
function requireProfileSession(req: Request, res: Response, next: NextFunction) {
    //from browser send cookie ID, interpret by express middleware
    //It uses the session id to load the session data from your session store
    //and attach to req
  const user = req.session.user;
  if (!user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  //Avoid repeating req.session.user in every handle
  res.locals.sessionUser = user;
  next();
}



// Basic profile info for the logged-in user.
router.get("/me", requireProfileSession, async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    delete req.session.user;
    res.status(404).json({ message: "User not found." });
    return;
  }
  res.json({ user });
});


// Update profile fields (currently only `name`).
router.patch("/me", requireProfileSession, async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

//“treat req.body as either:
//an object that may have a name field (name?)
//and if it has name, its type is unknown (we haven’t validated it yet)
//OR undefined”

  const nameRaw = (req.body as { name?: unknown } | undefined)?.name;
   
  if (nameRaw === undefined) {
    res.status(400).json({ message: "No fields to update." });
    return;
  }

  let name: string | null;
  if (nameRaw === null) {
    name = null;
  } else if (typeof nameRaw === "string") {
    const trimmed = nameRaw.trim();
    name = trimmed.length > 0 ? trimmed : null;
  } else {
    res.status(400).json({ message: "Name must be a string or null." });
    return;
  }

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: { name },
    select: { id: true, email: true, name: true },
  });

  req.session.user = {
    //copy anything inside the session
    ...sessionUser,
    name: user.name ?? null,
  };

  res.json({ message: "Profile updated.", user });
});


