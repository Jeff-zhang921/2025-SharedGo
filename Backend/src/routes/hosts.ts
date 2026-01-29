import { Router } from "express"; 
import { PrismaClient } from "@prisma/client"; 

const router = Router(); 
const prisma = new PrismaClient(); 

const DEFAULT_PAGE_SIZE = 10; // Default pagination size.
const MAX_PAGE_SIZE = 50; // Upper bound to avoid huge queries.
//page is all about how many items you FETCH at once

const parsePageSize = (raw: unknown, fallback = DEFAULT_PAGE_SIZE): number => { 
  const parsed = Number(raw); 
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback; // Fallback when invalid or non-positive.
  return parsed > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : Math.floor(parsed); // Clamp to max and floor.
};

const parsePage = (raw: unknown): number => { 
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 1) return 1; 
  return Math.floor(parsed);
};


const mapEventSummary = (event: {
  //it need contain given name and type
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
      : null; // Otherwise return null.

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


//mapping review data
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
  //validation
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
    upcomingEvents, // Next events preview.
    pastEvents, // Past events preview.
    totalUpcoming, // Count of upcoming events.
    totalPast, // Count of past events.
    eventsForStats, //this is an array of all events for this host
    recentReviews, // Latest reviews.
  ] = await Promise.all([ //fetch in parallel

    prisma.event.findMany({ // Upcoming events.
      where: { hostId, startsAt: { gte: now } }, 
      orderBy: { startsAt: "asc" }, 
      take: previewLimit,
      include: { participants: true }, // Load participants to count.
    }),

    prisma.event.findMany({ // Past events.
      where: { hostId, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" }, 
      take: previewLimit, 
      include: { participants: true }, 
    }),
    
    //how many upcoming and past events
    prisma.event.count({ where: { hostId, startsAt: { gte: now } } }), // Upcoming count.
    prisma.event.count({ where: { hostId, startsAt: { lt: now } } }), // Past count.

   //fetch all events for this host
    prisma.event.findMany({ 
      where: { hostId },
      include: { participants: true, reviews: true }, 
    }),


    //it has the intersect of authorevent object with a intersect with review
    prisma.review.findMany({ 
      where: { hostId }, 
      include: { author: true, event: true }, 
      orderBy: { createdAt: "desc" }, 
      take: previewLimit, 
    }),
  ]);



//reduce is a method that iterates through an array and accumulates a single value based on a provided function.
//total all participants accross the events hosted by that host
  const totalAttendees = eventsForStats.reduce( 
    //the reduce start at 0 and add
  //for each event, calculate the length of participant have in that event
    (sums: number, event: { participants: unknown[] }) => sums + event.participants.length, 
    0
  );

  //for later average fill 
  const capacityTotal=eventsForStats.reduce(
    // ?? If event.capacity is not null or undefined, use it.Otherwise, use 0.
    (sum: number, event: { capacity: number | null })=>sum+(event.capacity ??0),0
  )


  const averageFillRate =
    capacityTotal > 0 
      ? Number((totalAttendees / capacityTotal).toFixed(2))
      : null; 

      //what is the usecase of 
  const allRatings = eventsForStats 
    .flatMap((event: { reviews: { rating: number | null }[] }) => event.reviews)//glue all event together 
    .map((event: { rating: number | null }) => event.rating) // Take rating values.
    .filter((value: number | null): value is number => typeof value === "number"); 


    
  const averageRating =
    allRatings.length > 0
      ? Number(
          (allRatings.reduce((sum: number, value: number) => sum + value, 0) / allRatings.length).toFixed(2), 
        )
      : null; 



  res.json({ 
    host: {
      id: host.id, 
      name: host.name, 
      email: host.email, 
    },
    stats: {
      totalEvents: eventsForStats.length, //number of events for this host
      upcomingCount: totalUpcoming, //how many upcoming events
      pastCount: totalPast, //how many past events
      totalAttendees, //total attendees across all events
      averageFillRate, // Average fill rate across all events.
      averageRating, // Average rating across all reviews.
      reviewCount: allRatings.length, // Total number of reviews.
    },
    upcomingEvents: upcomingEvents.map(mapEventSummary), 
    pastEvents: pastEvents.map(mapEventSummary), 
    reviews: recentReviews.map(mapReview), 
  });
});







// Paginated host events list: upcoming/past/all.
router.get("/:hostId/events", async (req, res) => { 
  const hostId = Number(req.params.hostId); 

  if (!Number.isInteger(hostId)) { // Validate.
    res.status(400).json({ message: "Host id must be a number." }); 
    return; // Stop.
  }

  // Check if host exists
  const host = await prisma.user.findUnique({ where: { id: hostId } });
  if (!host) {
    res.status(404).json({ message: "Host not found." });
    return;
  }

//page = 1, limit = 10 → skip = 0
// page = 2, limit = 10 → skip = 10
// page = 3, limit = 10 → skip = 20
  
  const statusRaw = typeof req.query.status === "string" ? req.query.status : "upcoming"; 
  const status = statusRaw.toLowerCase(); 
  const limit = parsePageSize(req.query.limit); 
  const page = parsePage(req.query.page); 
  const skip = (page - 1) * limit; 
  const now = new Date(); 

  const where =
    status === "upcoming"
      ? { hostId, startsAt: { gte: now } } 
      : status === "past" 
        ? { hostId, startsAt: { lt: now } } 
        : { hostId }; 

  const [events, total] = await Promise.all([ 
    prisma.event.findMany({
      where, 
      //past events → newest first (desc)
      //upcoming/all → earliest first (asc)
      orderBy: { startsAt: status === "past" ? "desc" : "asc" }, 
      skip, 
      take: limit, 
      include: { participants: true }, 
    }),
    prisma.event.count({ where }),
  ]);

  res.json({ 
    pagination: { page, limit, total }, 
    events: events.map(mapEventSummary), 
  });
});




//  when you keep scrolling down you will see how to get review for a host
router.get("/:hostId/reviews", async (req, res) => { 
  const hostId = Number(req.params.hostId); 
  if (!Number.isInteger(hostId)) {
    res.status(400).json({ message: "Host id must be a number." }); 
    return;
  }

  // Check if host exists
  const host = await prisma.user.findUnique({ where: { id: hostId } });
  if (!host) {
    res.status(404).json({ message: "Host not found." });
    return;
  }
  const limit = parsePageSize(req.query.limit); 
  const page = parsePage(req.query.page); 
  const skip = (page - 1) * limit; 

  const [reviews, total] = await Promise.all([ // Fetch reviews and count.
    prisma.review.findMany({
      where: { hostId }, 
      include: { author: true, event: true }, 
      orderBy: { createdAt: "desc" }, 
      skip, 
      take: limit, 
    }),
    prisma.review.count({ where: { hostId } }), 
  ]);

  res.json({ 
    pagination: { page, limit, total }, 
    reviews: reviews.map(mapReview), 
  });
});

export default router; 
