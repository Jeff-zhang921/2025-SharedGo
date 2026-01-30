//this is the backend logic
import { Router, Request, Response } from "express"; 
import { PrismaClient, Category } from "@prisma/client";
import { requireSession } from "../middleware/requireSession";

const router = Router(); 
const prisma = new PrismaClient(); 

//parse coodinate make sure that coodinate is number
const parseCoordinate = (raw: unknown): number | null => {
  if (raw === undefined || raw === null || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number(raw);
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

export const Categories = Object.values(Category);
//publish event logic
//you can post on /events/create
// --- COMMENT OUT requireSession, TO TEST WITHOUT LOGIN ---
router.post("/create", /*requireSession,*/ async (req, res) => {
  // Read and sanitize inputs from the request body.
  //checks the field is a string; if so, trims it; otherwise gives a safe fallback.
//if anything is undefine in josn input, it will throw 

  const titleRaw = req.body?.title;
  const startsAtRaw = req.body?.startsAt;
  const locationRaw = req.body?.location;
  const hostEmailRaw = req.body?.hostEmail;
  const descriptionRaw = req.body?.description;
  const imageUrlRaw = req.body?.imageUrl;
  const externalUrlRaw = req.body?.externalUrl;
  const capacityRaw = req.body?.capacity; // could be number or string; validate below
  const categoryRaw = req.body?.category;
  const latitudeRaw = req.body?.latitude;
  const longitudeRaw = req.body?.longitude;

//? means if titleRaw is a string, trim it; otherwise use an empty string "" 

  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  const startsAtInput = typeof startsAtRaw === "string" ? startsAtRaw : "";
  const location = typeof locationRaw === "string" ? locationRaw.trim() : "";
  const hostEmail = typeof hostEmailRaw === "string" ? hostEmailRaw.trim() : "";
  const description = typeof descriptionRaw === "string" && descriptionRaw.trim() !== ""
    ? descriptionRaw.trim()
    : null;
  const imageUrl = typeof imageUrlRaw === "string" && imageUrlRaw.trim() !== ""
    ? imageUrlRaw.trim()
    : null;
  const externalUrl = typeof externalUrlRaw === "string" && externalUrlRaw.trim() !== ""
    ? externalUrlRaw.trim()
    : null;

    //treat categoryRaw as if it were already a valid Category type so that the .includes() function accepts it
    //and test whether or not it is inside the category list
  const category = typeof categoryRaw === "string" && Categories.includes(categoryRaw as Category)
    ? (categoryRaw as Category)
    : Category.Other;
const latitude = parseCoordinate(latitudeRaw);
  const longitude = parseCoordinate(longitudeRaw);

  
 // Basic required-field validation. If invalid, return 400 and stop.
  if (!title) {
    res.status(400).json({ message: "Title is required." });
    return;
  }

  if (!startsAtInput) {
    res.status(400).json({ message: "Start date/time is required." });
    return;
  }

 // Convert the startsAt string to a Date and ensure it’s valid.
  const startsAt = new Date(startsAtInput);
  if (Number.isNaN(startsAt.getTime())) {
    res.status(400).json({ message: "Start date/time is invalid." });
    return;
  }

  if (!location) {
    res.status(400).json({ message: "Location is required." });
    return;
  }

  if (!hostEmail) {
    res.status(400).json({ message: "Host email is required to publish an event." });
    return;
  }

 // Capacity is optional. If provided, parse to a finite non-negative integer.
  let capacity: number | null = null;
  if (capacityRaw !== undefined && capacityRaw !== null && capacityRaw !== "") {
    const parsedCapacity = Number(capacityRaw);
  //number.isfinite returns true only when value is a real,
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
      res.status(400).json({ message: "Capacity must be a positive number." });
      return;
    }
//math.floor round down number
    capacity = Math.floor(parsedCapacity);
  }


 // Ensure the host user exists by email.
  // upsert: if a user with that email exists -> return it; else create it.
  const host = await prisma.user.upsert({
    where: { email: hostEmail },
    update: {},
    create: { email: hostEmail },
  });


  // Create the event row in the database and also include related data in the result.
  const event = await prisma.event.create({
    data: {
      title,
      description,
      startsAt,
      capacity,
      category: category ?? undefined,
      location,
      latitude: latitude ?? null as any,
      longitude: longitude ?? null as any,
      imageUrl,
      externalUrl,
      // foreign key to the user we just upserted
      hostId: host.id,
    },

    include: {
      // include the host user object
      host: true,
       // include participants and each participant's user
      participants: {
        include: { user: true },
      },
    },
  });
 // Send Created with a clean response
  res.status(201).json({
    message: "Event created successfully.",
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      capacity: event.capacity,
      category: event.category,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      imageUrl: event.imageUrl,
      externalUrl: event.externalUrl,
      host: {
        id: event.host.id,
        email: event.host.email,
        name: event.host.name,
      },
      attendeeCount: event.participants.length,
    },
  });
});




//Logic to return list of ALL events
//can get at just /events so it lists all the events rather than just 1 for each id
//what it return is base on the user location, if location is provided, order by the nearest location event to far
router.get("/", async (req, res) => {
  try {
    const queryLatitude = parseCoordinate(
      typeof req.query.latitude === "string" ? req.query.latitude : undefined,
    );
    const queryLongitude = parseCoordinate(
      typeof req.query.longitude === "string" ? req.query.longitude : undefined,
    );
    //bool
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
      //"If the thing on the left is null or undefined, give me the thing on the right
      : sessionLocation?.longitude ?? null;

    const events = await prisma.event.findMany({
      include: {
        host: true,
        participants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedEvents = events.map((event) => {
      let distance: number | null = null;
      if (
        userLatitude !== null &&
        userLongitude !== null &&
        event.latitude !== null &&
        event.longitude !== null
      ) {
        distance = distanceInKm(
          userLatitude,
          userLongitude,
          event.latitude,
          event.longitude,
        );
      }

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        capacity: event.capacity,
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
        attendeeCount: event.participants.length,
        distance: distance !== null ? Number(distance.toFixed(3)) : null,
      };
    });

    let result = formattedEvents;

    if (userLatitude !== null && userLongitude !== null) {
      result = [...result].sort((a, b) => {
        const distanceA = a.distance !== null ? a.distance : Infinity;
        const distanceB = b.distance !== null ? b.distance : Infinity;
        //in ascending order
        return distanceA - distanceB;
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching events", error);
    res.status(500).json({ message: "Internal server error while fetching events." });
  }
});






//return json object with event id....
//you can get at /events/:id
router.get("/:id", async (req, res) => { 
  const idText = req.params.id; 
  const eventId = Number(idText);

  if (!Number.isInteger(eventId)) { 
    res.status(400).json({ message: "Event id must be a number." }); 
    return; 
  }

  //find database
  const event = await prisma.event.findUnique({ 
    where: { id: eventId }, 
    include: { 
      host: true, 
      participants: { 
        include: { user: true }, 
      },
      reviews: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) { 
    res.status(404).json({ message: "Event not found." }); 
    return; 
  }

  //calculate (attendeeCount) and (seatsRemaining)
  const attendeeCount = event.participants.length; 

  let seatsRemaining: number | null = null; // Prepare a variable that will hold the number of free seats (if we have capacity).
  //if event capacity has set to any number it will calculate seat remaining
  if (typeof event.capacity === "number") {
    const remaining = event.capacity - attendeeCount; // Subtract the number of attendees from the total capacity.
    seatsRemaining = remaining > 0 ? remaining : 0; // Never show a negative value even if we somehow go over.
  }
  
  //map copy participant array to attendees and only copy field of return in participate to attendees
  //which is
  const attendees = event.participants.map((participant: { user: { id: number; name: string | null; email: string }; joinedAt: Date }) => { // Build an array that only contains the data the UI needs.
    const participantUser = participant.user; // Pull the related user off the participant record to keep the code readable.
    return { 
      id: participantUser.id, 
      name: participantUser.name, 
      email: participantUser.email, 
      joinedAt: participant.joinedAt, 
    };
  });

  //map copy review array to reviews and only copy field of return in review to reviews
  const reviews = event.reviews.map((review: {
    id: number;
    rating: number | null;
    comment: string | null;
    createdAt: Date;
    author: { id: number; name: string | null; email: string };
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
  }));

  //return only rating number in array
  //calculate average rating
  //if is null or undefined, filter it out
  const ratingValues = event.reviews
    .map((review: { rating: number | null }) => review.rating)
    .filter((value: number | null): value is number => typeof value === "number");
  const averageRating =
    ratingValues.length > 0
      ? Number(//only keep two decimal points
          (ratingValues.reduce((sum: number, value: number) => sum + value, 0) / ratingValues.length).toFixed(2),
        )
      : null;

  res.json({ // Send back the event details as JSON so the front end can show the screen.
    id: event.id, 
    title: event.title, 
    description: event.description, 
    startsAt: event.startsAt, 
    capacity: event.capacity, 
    seatsRemaining, 
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
    attendees, 
    attendeeCount, 
    averageRating,
    reviews,
  });
});


// Handle the case where someone presses "Join" on the event screen.
//it takes in eventid
//you can post on /events/:id/join
router.post("/:id/join", requireSession, async (req, res) => { 
  // Read the event id from the URL.
  const idText = req.params.id;
  const eventId = Number(idText); // Turn the id string into a number.

  if (!Number.isInteger(eventId)) { // Stop early if the id is not a proper number.
    res.status(400).json({ message: "Event id must be a number." }); // Tell the client about the problem.
    return; // Exit the handler.
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""; // Pull the email from the JSON body and trim spaces.
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined; // Pull the optional name.

  if (email.length === 0) { // We require at least an email to identify the user.
    res.status(400).json({ message: "Email is required to join the event." }); // Respond with a helpful error.
    return; // Exit the handler.
  }

  const event = await prisma.event.findUnique({ // Fetch the event with all related data.
    where: { id: eventId }, // Match by id.
    include: { // Load the pieces we need to run validation.
      host: true, // Host information (optional but consistent with the GET route).
      participants: { // Everyone who already joined.
        //in each participant
        include: { user: true }, // Include the related user for each participant.
      },
    },
  });

  if (!event) { // If the event does not exist we cannot join it.
    res.status(404).json({ message: "Event not found." }); // Inform the client.
    return; // End the handler.
  }

  const attendeeCount = event.participants.length; // Count how many attendees we already have.

  if (typeof event.capacity === "number" && attendeeCount >= event.capacity) { // If the event is full,
    res.status(409).json({ message: "Event is already full." }); // let the client know.
    return; // Stop here because we cannot add more people.
  }

  const userAlreadyJoined = event.participants.some((participant: { user: { email: string } }) => { // Check if this email already appears in the attendee list.
    return participant.user.email.toLowerCase() === email.toLowerCase(); // Compare emails case-insensitively.
  });

  if (userAlreadyJoined) { // If the user is already in the list we do not create a duplicate row.
    res.status(200).json({ message: "You have already joined this event." }); // Return a friendly message that nothing changed.
    return; // Exit the handler.
  }

  const participant = await prisma.eventParticipant.create({ // Create the join row that links the user to the event.
    data: { // Provide the fields Prisma needs.
      event: { connect: { id: event.id } }, // Connect to the event by id.
      user: { // Connect to a user by email or create a brand-new user on the fly.
        connectOrCreate: { // This helper avoids needing two queries.
          where: { email }, // Look for an existing user with this email.
          create: { // If none exists, create one.
            email, // Required email field.
            name, // Optional name field (can be undefined).
          },
        },
      },
    },
    include: { user: true }, // Include the user so we can echo it back in the response.
  });

  res.status(201).json({ // Send a 201 Created response so the client knows the join succeeded.
    message: "Joined the event successfully.", // Simple confirmation message.
    attendee: { // Return the newly joined attendee details.
      id: participant.user.id, // Participant user id.
      name: participant.user.name, // Participant name.
      email: participant.user.email, // Participant email.
      joinedAt: participant.joinedAt, // When they joined.
    },
  });
});






// Allow attendees to leave or update a review for an event (and host).
router.post("/:id/reviews", requireSession, async (req, res) => {
  const idText = req.params.id;
  const eventId = Number(idText);


  //validate event id
  if (!Number.isInteger(eventId)) {
    res.status(400).json({ message: "Event id must be a number." });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const commentInput = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
  const ratingRaw = req.body?.rating;

  if (email.length === 0) {
    res.status(400).json({ message: "Email is required to leave a review." });
    return;
  }


  //validate rating
  let rating: number | null = null;
  if (ratingRaw !== undefined && ratingRaw !== null && ratingRaw !== "") {
    const parsedRating = Number(ratingRaw);
    if (
      !Number.isFinite(parsedRating) ||
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
      return;
    }
    rating = parsedRating;
  }

  const comment = commentInput.length > 0 ? commentInput : null;

  if (rating === null && !comment) {
    res.status(400).json({ message: "Provide at least a rating or a comment." });
    return;
  }

  //validate event id
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      host: true,
      participants: { include: { user: true } },
    },
  });

  if (!event) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  if (event.startsAt > new Date()) {
    res.status(400).json({ message: "Reviews can be left only after the event starts." });
    return;
  }

  const participant = event.participants.find(
    (participantRecord: { user: { email: string }; userId: number }) =>
      participantRecord.user.email.toLowerCase() === email.toLowerCase(),
  );

  if (!participant) {
    res.status(403).json({ message: "Only attendees of this event can leave a review." });
    return;
  }

  const review = await prisma.review.upsert({
//Find the review where
// eventId = this event and authorId = this user.
// If such a review exists → go to the update block.
// If it does not exist → go to the create block.
    where: {
      eventId_authorId: { eventId: event.id, authorId: participant.userId },
    },
    update: {
      rating,
      comment,
    },
    create: {
      rating,
      comment,
      eventId: event.id,
      hostId: event.hostId,
      authorId: participant.userId,
    },
    //This controls what Prisma returns after the upsert.
    include: {
      author: true,
      event: true,
    },
  });

  res.status(201).json({
    message: "Review saved.",
    review: {
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
    },
  });
});

export default router; // Export the router so index.ts can mount the /events routes.
