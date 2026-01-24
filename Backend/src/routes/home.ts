import { Router, Request, Response } from 'express';
import { PrismaClient, Category, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

//home dashboard returns recommended (top 5), categories list, and upcoming events
router.get("/", async (req: Request, res: Response) => {
    try {
        const now = new Date();  //get current date
        // Extract query parameters
        const category = typeof req.query.category === "string" ? (req.query.category as Category) : null;
        const search = typeof req.query.search === "string" ? req.query.search : null;
        const userLatitude = req.query.latitude ? Number(req.query.latitude) : null;
        const userLongitude = req.query.longitude ? Number(req.query.longitude) : null;

        const whereClause: Prisma.EventWhereInput = {
            startsAt: { gte: now },
        };
        if (category) {
            whereClause.category = category;
        }
        if (search) { // Case-insensitive search in title
            whereClause.title = { contains: search, mode: 'insensitive' };
        }
        const events = await prisma.event.findMany({
            where: whereClause,
            include : {
                host: true,
                participants: true,
            },
            orderBy : { startsAt: 'asc'}, // sort by date ascending
        });
        
        // Map the results
        const feed = events.map((event) => {
            let distance: number | null = null;
            //calculate distance only if both user and eventlocation is provided
            if (userLatitude !== null && userLongitude !== null && event.latitude && event.longitude) {
                distance = distanceInKm(
                    userLatitude,
                    userLongitude,
                    event.latitude,
                    event.longitude
                );
            }
            const count = event.participants.length;
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
                attendeeCount: count,
                seatsRemaining: event.capacity ? event.capacity - count : "Unlimited",
                distance: distance !== null ? Number(distance.toFixed(3)) : null,
            };
        });
        
        //sort the feed by nearest then most popular
        feed.sort((a, b) => {
            if (a.distance !== null && b.distance !== null) {
                return (a.distance ?? Infinity) - (b.distance ?? Infinity); // Nearest first
            }
            //if distances are equal then sort by most popular
            return b.attendeeCount - a.attendeeCount; 
        });

        res.json({ 
            recommendedEvents: feed.slice(0, 5),  //top 5 recommended
            categories: Object.values(Category), //turn Enum into array of strings
            upcoming: feed,  //all sorted upcoming events
        });
    } catch (error) {
        console.error("Home feed error:", error);
        res.status(500).json({ error: "Failed to load feed" });
    }
});

//get list of categories
router.get("/categories", (req: Request, res: Response) => {
    try {
        res.json({ categories: Object.values(Category) });
    } catch (error) {
        console.error("Categories error:", error);
        res.status(500).json({ error: "Failed to load categories" });
    }
});

//get events by category
router.get("/categories/:categoryName", async (req: Request, res: Response) => {
    const categoryName = req.params.categoryName as Category;
    try {
        const events = await prisma.event.findMany({
            where: { category: categoryName, startsAt: { gte: new Date() } },
            include : {
                host: true,
                participants: true,
            }});
            res.json(events);
        } catch (error) {
            res.status(500).json({ error: "Failed to load events for category" });          
        }
    });

export default router;

