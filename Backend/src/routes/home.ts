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

router.get("/feed", async (req: Request, res: Response) => {
    try {
        const now = new Date();  
        
        const category = typeof req.query.category === "string" ? (req.query.category as Category) : null;
        const search = typeof req.query.search === "string" ? req.query.search : null;
        const userLatitude = req.query.latitude ? Number(req.query.latitude) : null;
        const userLongitude = req.query.longitude ? Number(req.query.longitude) : null;
        // Build the where clause dynamically based on query parameters
        const whereClause: Prisma.EventWhereInput = {
            startsAt: { gte: now },
        };
        if (category) {
            whereClause.category = category;
        }
        if (search) {
            whereClause.title = { contains: search, mode: 'insensitive' };
        }
        const events = await prisma.event.findMany({
            where: whereClause,
            include : {
                host: true,
                participants: true,
            },
            orderBy : { startsAt: 'asc'}, 
        });
        
        // Map the results
        const feed = events.map((event) => {
            let distance: number | null = null;
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
        if (userLatitude !== null && userLongitude !== null) {
            feed.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        res.json({ 
            recommendedEvents: feed.slice(0, 5), 
            upcoming: feed, 
        });
    } catch (error) {
        console.error("Home feed error:", error);
        res.status(500).json({ error: "Failed to load feed" });
    }
});
export default router;

