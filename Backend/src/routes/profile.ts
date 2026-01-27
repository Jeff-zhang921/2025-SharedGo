//me page
import { NextFunction, Request, Response, Router } from "express";
import { Category, Prisma, PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

//convert unknown to number but with maximum
//how many item per page
//fallback is the Default Parameter.
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
  latitude: number | null;
  longitude: number | null;
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



// Overview for the profile screen (previews + counts).
router.get("/me/overview", requireProfileSession, async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const userId = sessionUser.id;
  const now = new Date();
  const previewLimit = 5;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    delete req.session.user;
    res.status(404).json({ message: "User not found." });
    return;
  }


//TypeScript type that describes the allowed shape of that filter.
  const baseWhere: Prisma.EventWhereInput = {
    //OR is or operator between hostID and participants,
    //some: is This event has at least one participant whose userId equals userId.”
    OR: [{ hostId: userId }, { participants: { some: { userId } } }],
  };

  //Typescript Type that Used in include: to decide what relations to fetch along with each event.
  const includeForUser: Prisma.EventInclude = {
    //if you want to pick specific fields and fetch a relation. select and include cannot be same level
    //want the info whole table but only this field
    host: { select: { id: true, name: true, email: true }},
    
    participants: {
        //only want this with specific userid
      where: { userId },
      select: { userId: true, joinedAt: true },
    },
    //whole relation. even if participants is filtered, _count shows the total number of participants
    _count: { select: { participants: true } },
  };

//Output: It waits until the last one is finished not finish A then B then C
//upcomingevent only have 5 event but upcoming count return every event that is upcoming
//those four are array of object
  const [upcomingEvents, pastEvents, upcomingCount, pastCount] = await Promise.all([
    prisma.event.findMany({
      where: { ...baseWhere, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      //only give me the first 5 event
      take: previewLimit,
      include: includeForUser,
    }),
    prisma.event.findMany({
      where: { ...baseWhere, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: previewLimit,
      include: includeForUser,
    }),
    //count return a number
    //using count so 5 event return in detail and 100 event(in total can telling the total event)
    prisma.event.count({ where: { ...baseWhere, startsAt: { gte: now } } }),
    prisma.event.count({ where: { ...baseWhere, startsAt: { lt: now } } }),
  ]);

  res.json({
    user,
    stats: { upcomingCount, pastCount },
   upcomingEvents: upcomingEvents.map((event) => mapEventSummary(event, userId)),
    pastEvents: pastEvents.map((event) => mapEventSummary(event, userId)),
  });
});



// Paginated list of the user's events (joined and/or hosted).
router.get("/me/events", requireProfileSession, async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }
  

  const userId = sessionUser.id;
  const now = new Date();
  //if it is not string request upcoming
  const statusRaw = typeof req.query.status === "string" ? req.query.status : "upcoming";
  const status = statusRaw.toLowerCase();
  const limit = parsePageSize(req.query.limit);
  const page = parsePage(req.query.page);
  //how many rows ignore when start of the result
  const skip = (page - 1) * limit;
  if (!["upcoming", "past", "all"].includes(status)) {
    res.status(400).json({ message: "status must be upcoming, past, or all." });
    return;
  }
  const where: Prisma.EventWhereInput = {
    //condition 1 if the user is the host
   //some: does the list of participants contain atleast one with this userId?
    OR: [{ hostId: userId }, { participants: { some: { userId } } }],
  };

  if (status === "upcoming") {
    where.startsAt = { gte: now };
  } else if (status === "past") {
    where.startsAt = { lt: now };
  }

  const includeForUser: Prisma.EventInclude = {
    host: { select: { id: true, name: true, email: true } },
    participants: {
      where: { userId },
      select: { userId: true, joinedAt: true },
    },
    //the point of using _ count here is to get the whole list of paritcipant in this event.
    //since you cannot use .length cause  where: { userId }, will only return that one row not the whole row
    _count: { select: { participants: true } },
  };

  const orderDirection = status === "past" ? "desc" : "asc";

  const [events, total] = await Promise.all([
    prisma.event.findMany({
    //event data whether joined by me or created by me
      where,
      orderBy: { startsAt: orderDirection },
      skip,
      take: limit,
      include: includeForUser,
    }),
    
    prisma.event.count({ where }),
  ]);

  res.json({
    pagination: { page, limit, total },
    events: events.map((event) => mapEventSummary(event, userId)),
  });
});



// Paginated list of reviews authored by the user.
router.get("/me/reviews", requireProfileSession, async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const userId = sessionUser.id;

  const limit = parsePageSize(req.query.limit);
  const page = parsePage(req.query.page);
  const skip = (page - 1) * limit;

  const where = { authorId: userId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { author: true, host: true, event: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    pagination: { page, limit, total },
    // The cast keeps the mapper strict while Prisma's include result remains inferred
    // convert the review to unkown since anything can be unknown and then casr unknown to reviewprofilerow since unknown can cast to anything
    reviews: reviews.map((review) => mapReview(review as unknown as ReviewProfileRow)),
  });
});

export default router;

