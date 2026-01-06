import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get("/feed", async (req, res) => {
    const now = new Date();  //get current date
    // get query parameters
    const category = typeof req.query.category === "string" ? req.query.category : null;
    const userLatitude = req.query.latitude ? Number(req.query.latitude) : null;
    const userLongitude = req.query.longitude ? Number(req.query.longitude) : null;
    //fetch events
    const events = await prisma.event.findMany({
        where: {
            startsAt: { gte: now },
            ...(category ? { category: category } : {}), //filter by category if provided
        },
        include : {
            host: true,
            participants: true,
        },
        orderBy : { startsAt: 'asc'}, //sort by date, soonest first
    });
    
    //calculate nearby distance 
    let feed = events.map((event) => {
        let distance = null;
        if (userLatitude !== null && userLongitude !== null && event.latitude && event.longitude) {
            const dLat = event.latitude - userLatitude;
            const dLon = event.longitude - userLongitude;
            distance = Math.sqrt(dLat * dLat + dLon * dLon);
        }
        return {
            id: event.id,
            title: event.title,
            description: event.description,
            startsAt: event.startsAt,
            capacity: event.capacity,
            seatsRemaining: event.capacity - event.participants.length,
            category: event.category,
            location: event.location,
            latitude: event.latitude,
            longitude: event.longitude,
            imageUrl: event.imageUrl,
            externalUrl: event.externalUrl,
            host: {
                id: event.host.id,
                name: event.host.name,
                email: event.host.email,
            },
            distance: distance,
        };
    });
    //sort by distance
    if (userLatitude !== null && userLongitude !== null) {
        feed.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    res.json({ 
        recommendedEvents: feed.slice(0, 5), //top 5 for caraousel
        upcoming: feed, //all sorted events
    });
});
export default router;
