//seed file is use to init database
import { PrismaClient } from "./generated/prisma"; 


const prisma = new PrismaClient(); 
async function main(): Promise<void> { // Wrap the seeding logic in an async function so we can await queries.
  const hostEmail = "host@sharego.dev"; 
  
  //update the host
  const host = await prisma.user.upsert({ // Either fetch the host if it exists or create it.
    where: { email: hostEmail }, 
    update: {}, 
    create: { 
      email: hostEmail, 
      name: "Host", 
    }, 
  }); 

  //when define a list in prisma, it will have a lower case generate under prismaclient which you can use many property 
  const existingEvent = await prisma.event.findFirst({ 
    where: { title: "Community Meetup", hostId: host.id },
    include: { // Ask Prisma to include related information when it finds the event.
      // Include the host user so we can log their details later.
      //true means please upload, prisma will upload  corresponding user
      host: true, 
      //true mean take all the relational object back
      participants: { include: { user: true } }, // Include every participant and each participant's user profile.
    }, 
  }); 
  
  const event = existingEvent // Decide whether we can reuse the existing event or need to create one.
    ? existingEvent 
    : await prisma.event.create({
        data: { // Describe the fields we want Prisma to populate.
          title: "Community Meetup", 
          description: "Hang out with people nearby and enjoy some snacks.", 
          startsAt: new Date("2025-10-10T17:00:00.000Z"),
          capacity: 1234, 
          location: "Central Park", 
          imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=400&q=80",
          externalUrl: "https://example.com/sharego/community-meetup", 
          hostId: host.id,
        }, 
        include: { // Include the same related data we requested earlier so `event` has a consistent shape.
          host: true, // Include the host for logging.
          participants: { include: { user: true } }, // Include participants even though the event is new (there will be zero).

        }, 
      }); 


  const attendeeEmail = "attendee@sharego.dev"; 

  let attendeeUser = await prisma.user.findUnique({ 
    where: { email: attendeeEmail }, 
  }); 

  if (!attendeeUser) {
    attendeeUser = await prisma.user.create({ 
      data: { 
        email: attendeeEmail, 
        name: "First Attendee", 
      }, 
    });
  } 
 
  

  const existingJoin = await prisma.eventParticipant.findUnique({ // Check the join table to avoid duplicate records.
    where: { eventId_userId: { eventId: event.id, userId: attendeeUser.id } }, 
  }); 
 
  if (!existingJoin) { // Only add the attendee if they have not joined yet.
    await prisma.eventParticipant.create({ 
      data: { 
        eventId: event.id, 
        userId: attendeeUser.id, 
      }, 
    }); 
  } 
 
  console.log(
    [
      "Seeded ShareGo event:", 
      `- Event: ${event.title}`, 
      `- Host: ${host.email}`, 
      `- Attendee added: ${attendeeEmail}`,
    ].join("\n"), // Join the summary lines with new lines for nicer formatting.
  ); 
} 

main() 
  .catch((error) => { 
    console.error("Seeding failed:", error); 
    process.exit(1); 
  }) 
  .finally(async () => { 
    await prisma.$disconnect(); 
  }); 
