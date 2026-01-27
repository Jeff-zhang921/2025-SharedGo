import { Router, Request, Response } from 'express';
import { PrismaClient, Category, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const parseCoordinate = (raw: unknown): number | null => {
    if (typeof raw !== "string") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
};

// Haversine formula to calculate distance between two lat/lon points
function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km    
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
//handles distance calculation and attendee count for mapping event data
function mapEvent(
    event: any,
    userLatitude: number | null,
    userLongitude: number | null
) {
    const attendeeCount = event.participants.length;
    let distance: number | null = null;
    if (userLatitude !== null && userLongitude !== null && event.latitude !== null && event.longitude !== null) {
        distance = distanceInKm(
            userLatitude,
            userLongitude,
            event.latitude,
            event.longitude
        );
    }
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        category: event.category,
        location: event.location,
        imageUrl: event.imageUrl,
        host: {
            id: event.host.id,
            name: event.host.name,
            email: event.host.email,
        },
        attendeeCount: attendeeCount,
        seatsRemaining: event.capacity ? event.capacity - attendeeCount : "Unlimited",
        distance: distance !== null ? Number(distance.toFixed(3)) : null,
    };
}       

//home dashboard returns recommended (top 5), categories list, and upcoming events
router.get("/", async (req: Request, res: Response) => {
    try {
        const now = new Date();  //get current date
        // Extract query parameters
        const search = typeof req.query.search === "string" ? req.query.search : null;
        const queryLatitude = parseCoordinate(req.query.latitude);
        const queryLongitude = parseCoordinate(req.query.longitude);

        const hasQueryCoords = queryLatitude !== null && queryLongitude !== null;
        if (hasQueryCoords) {
            req.session.location = {
                latitude: queryLatitude,
                longitude: queryLongitude,
                updatedAt: new Date().toISOString(),
            };
        }

        const sessionLocation = req.session.location;
        const userLatitude = hasQueryCoords
            ? queryLatitude
            : sessionLocation?.latitude ?? null;
        const userLongitude = hasQueryCoords
            ? queryLongitude
            : sessionLocation?.longitude ?? null;

        const whereClause: Prisma.EventWhereInput = {
            startsAt: { gte: now },
        };

        if (search) { // Case-insensitive search 
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
            ];
        };
        const events = await prisma.event.findMany({
            where: whereClause,
            include : {
                host: true,
                participants: { select: { userId: true } }, //only need participant count
            },
            orderBy : { startsAt: 'asc'}, // sort by date ascending
        });

        const mapped = events.map(event => mapEvent(event, userLatitude, userLongitude));
        const recommendedEvents = [...mapped]
            .sort ((a, b) => {
                const distanceA = a.distance !== null ? a.distance : Infinity;
                const distanceB = b.distance !== null ? b.distance : Infinity;
                if (distanceA !== distanceB) {
                    return distanceA - distanceB; // Nearest first
                }
                return b.attendeeCount - a.attendeeCount; // Most popular next
            })
            .slice(0, 5); // Top 5 recommended
    
        const upcomingPreview = [...mapped]
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()) // Soonest first
            .slice(0, 5); // Next 5 upcoming events

        res.json({ 
            recommendedEvents,  
            categories: Object.values(Category), //turn Enum into array of strings
            upcomingPreview, 
      });
    } catch (error) {
        console.error("Home feed error:", error);
        res.status(500).json({ error: "Failed to load feed" });
    }
});

//get list of all categories
router.get("/categories", (req: Request, res: Response) => {
    try {
        res.json({ categories: Object.values(Category) });
    } catch (error) {
        console.error("Categories error:", error);
        res.status(500).json({ error: "Failed to load categories" });
    }
});

//filter events by category
router.get("/categories/:categoryName", async (req: Request, res: Response) => {
    const categoryName = req.params.categoryName as Category;  
    try {
        const events = await prisma.event.findMany({
            where: { category: categoryName, startsAt: { gte: new Date() } },
            include : {
                host: true,
                participants: {select: { userId: true } }, 
            },
            orderBy: { startsAt: 'asc' },
        });
            res.json({
                events: events.map(event => mapEvent(event, null, null)),
            });
        } catch (error) {
            res.status(500).json({ error: "Failed to load events for category" });          
        }
    });

//upcoming events list to see all events
//support pagination (10 per page)
router.get("/upcoming", async (req: Request, res: Response) => {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try{
        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where: { startsAt: { gte: new Date() } },
                include : {
                    host: true,
                    participants: true,
                },
                orderBy: { startsAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma.event.count({ where: { startsAt: { gte: new Date() } } }),
        ]);

        res.json({
            pagination: {
                page,
                limit,
                total,
            },
            events: events.map(event => mapEvent(event, null, null)),
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load upcoming events" });
    }
});
export default router;

