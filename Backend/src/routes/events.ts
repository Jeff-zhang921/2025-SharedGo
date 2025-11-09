//this is the backend logic
import { Router } from "express"; 
import { PrismaClient } from "../generated/prisma";

const router = Router(); 
const prisma = new PrismaClient(); 

//publish event logic
router.post("/", async (req, res) => {

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const startsAtInput = typeof req.body?.startsAt === "string" ? req.body.startsAt : "";
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  const hostEmail = typeof req.body?.hostEmail === "string" ? req.body.hostEmail.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : undefined;
  const externalUrl = typeof req.body?.externalUrl === "string" ? req.body.externalUrl.trim() : undefined;
  const capacityRaw = req.body?.capacity;

  if (!title) {
    res.status(400).json({ message: "Title is required." });
    return;
  }

  if (!startsAtInput) {
    res.status(400).json({ message: "Start date/time is required." });
    return;
  }

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

  let capacity: number | null = null;
  if (capacityRaw !== undefined && capacityRaw !== null && capacityRaw !== "") {
    const parsedCapacity = Number(capacityRaw);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
      res.status(400).json({ message: "Capacity must be a positive number." });
      return;
    }
    capacity = Math.floor(parsedCapacity);
  }

  const host = await prisma.user.upsert({
    where: { email: hostEmail },
    update: {},
    create: { email: hostEmail },
  });

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startsAt,
      capacity,
      location,
      imageUrl,
      externalUrl,
      hostId: host.id,
    },
    include: {
      host: true,
      participants: {
        include: { user: true },
      },
    },
  });

  res.status(201).json({
    message: "Event created successfully.",
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      capacity: event.capacity,
      location: event.location,
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






//return json object with event id....
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
  const attendees = event.participants.map((participant) => { // Build an array that only contains the data the UI needs.
    const participantUser = participant.user; // Pull the related user off the participant record to keep the code readable.
    return { 
      id: participantUser.id, 
      name: participantUser.name, 
      email: participantUser.email, 
      joinedAt: participant.joinedAt, 
    };
  });

  res.json({ // Send back the event details as JSON so the front end can show the screen.
    id: event.id, 
    title: event.title, 
    description: event.description, 
    startsAt: event.startsAt, 
    capacity: event.capacity, 
    seatsRemaining, 
    location: event.location, 
    imageUrl: event.imageUrl, 
    externalUrl: event.externalUrl, 
    host: { 
      id: event.host.id, 
      name: event.host.name, 
      email: event.host.email,
    },
    attendees, 
    attendeeCount, 
  });
});


// Handle the case where someone presses "Join" on the event screen.
//it takes in eventid
router.post("/:id/join", async (req, res) => { 
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

  const userAlreadyJoined = event.participants.some((participant) => { // Check if this email already appears in the attendee list.
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

export default router; // Export the router so index.ts can mount the /events routes.
