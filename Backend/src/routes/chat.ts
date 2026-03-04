import{Router,Request,Response} from "express"
import { PrismaClient } from "@prisma/client";

const router=Router()
const prisma= new PrismaClient()

//User click message host
router.post("/threads",async (req:Request,res:Response)=>{
    const hostId= typeof req.body?.hostId==="number"?req.body.hostId:Number(req.body.hostId)
    const guestId= req.session.user?.id
    if (!guestId){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    if (!Number.isInteger(hostId)||hostId<=0||isNaN(hostId)){
        res.status(400).json({message:"Valid hostId is required"})
        return
    }
    if (hostId===guestId){
        res.status(400).json({message:"Cannot create thread with yourself"})
        return
    }
    //check if host exists
    const host =await prisma.user.findUnique({
        where:{id:hostId},
        select:{id:true}
    })
    if (!host){
        res.status(404).json({message:"Host not found"})
        return
    }
    //find existing thread
    let thread=await prisma.chatThread.findFirst({
        where:{
            hostId,
            guestId,
        }
    })
    if (!thread){
        thread=await prisma.chatThread.create({
            data:{hostId,guestId}
        })
    }
    res.json({threadId:thread.id})
})






router.get("/threads",async (req:Request,res:Response)=>{
    const userId=req.session.user?.id
    
    if(!userId){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    const threads=await prisma.chatThread.findMany({
        where:{
            OR:[
                {hostId:userId},
                {guestId:userId}]
        },
        include:{
    host:{select:{id:true,name:true,email:true}},
    guest:{select:{id:true,name:true,email:true}},
    //get one msg for display
    Messages:{
                take:1,
                orderBy:{createdAt:"desc"},
                select:{id:true,body:true,createdAt:true,senderId:true}
            }
        },
        orderBy:[{lastMessageAt:"desc"},
        {updatedAt:"desc"}
        ]
    })
    res.json(threads)
}
)
router.get("/users",async(req:Request,res:Response)=>{
const userId=req.session.user?.id
const query=typeof req.query?.query==="string"?req.query.query.trim():""
if(!userId){
    res.status(401).json({message:"Unauthorized"})
    return
}
const users=await prisma.user.findMany({
    where:query
    ?{
        id:{not:userId},
        OR:[
            {email:{contains:query,mode:"insensitive"}},
            {name:{contains:query,mode:"insensitive"}}
        ]
    }
    :{
        id:{not:userId}
    },
    select:{id:true,name:true,email:true},
    orderBy:{email:"asc"},
    take:25
})
return res.json(users)
})

router.get("/threads/:threadId/messages",async (req:Request,res:Response)=>{
    const userId=req.session.user?.id
    if(!userId){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    const threadId=Number(req.params.threadId)
    if (!Number.isInteger(threadId)||threadId<=0||isNaN(threadId)){
        res.status(400).json({message:"Valid threadId is required"})
        return
    }
    const thread=await prisma.chatThread.findUnique({
        where:{id:threadId},
        select:{id:true,hostId:true,guestId:true}
    })
    if (!thread){
        res.status(404).json({message:"Thread not found"})
        return
    }
    if (thread.hostId!==userId && thread.guestId!==userId){
        res.status(403).json({message:"Forbidden"})
        return
    }
    const messages=await prisma.chatMessage.findMany({
        where:{threadId},
        orderBy:{createdAt:"asc"}
    })
    res.json(messages)

})

export default router
// //Execution Order

// Install Socket.IO deps

// From Backend, install socket.io and socket.io.
// Command (example): npm install socket.io and socket.io
// Update Prisma schema

// Edit schema.prisma.
// Add ChatThread and ChatMessage.
// Add thread/message relations on User.
// Add unique constraint (hostId, guestId).
// Run Prisma migration
// Run npx prisma migrate dev --name chat.
// Run npx prisma generate.

// Extract session middleware
// Move the express-session config from index.ts into a shared module (e.g. session.ts).
// Export the middleware so Socket.IO can reuse it.

// Create Socket.IO bootstrap
// Add a new file for socket init, e.g. index.ts.
// Create Socket.IO server, attach to HTTP server.
// Reuse the session middleware for Socket.IO auth.
// Store user on socket.data.user.

// Define socket event flow
// thread:join → validate thread membership → join room.
// message:send → validate → persist message → emit message:new.








// Add chat REST routes
// Create chat.ts.
// Endpoints:
// POST /chat/threads (create/find thread)
// GET /chat/threads (list threads)
// GET /chat/threads/:id/messages (history)
// POST /chat/threads/:id/read (mark read)
// Use requireSession for auth.


// Mount routes
// In index.ts, mount /chat router.



// Wire Socket.IO to HTTP server
// Replace app.listen with http.createServer(app).listen.
// Call your socket init with that server.









// Update docs
// Add chat endpoints and socket events to API_README.md.
// Manual test sequence

// Login and create a thread (POST /chat/threads).
// Join socket room (thread:join).
// Send message (message:send) and confirm:
// DB write happened
// message:new event emitted to both users
// Load history via REST.
// Validate read/unread counts.
// Production note (later)

// Replace MemoryStore with Redis.
// Add Socket.IO Redis adapter if scaling.
