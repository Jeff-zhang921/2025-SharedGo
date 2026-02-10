import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { sessionMiddleware } from "../session";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();

export function initSocket(server: HttpServer) {
  //attach http server to a new server
//If a visitor arrives via HTTP: The "Big Server" sends them to the Express office.
//If a visitor arrives via WebSocket: The "Big Server" sends them to the Socket.io offce.
//They share the same IP address, the same Port, and—most importantly—the same Security (CORS) and Identity (Cookies/Sessions).

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });
  //io.use: This is a method that adds a "Middleware
// your WebSocket "steal" the session store from your express server
//browser will send a cookie to socket.io which is the same cookie send to express to verify. socket.io go to session store to verify so user don't need to login
//but you can't use the express session middleware in socket.io since they are different 
  io.use((socket, next) => {
    //{}is i do not expect you to send back any response to user or browser.
    (sessionMiddleware as any)(socket.request, {}, next);
  });

  io.use((socket, next) => {
    const session = (socket.request as any).session;
    const user = session?.user;
    if (!user) {
      next(new Error("Not authenticated."));
      return;
    }
    //socket.data is a placeholder for socket to store anything?
    socket.data.user = user;
    next();
  });

//Listens at the server level. this fire once per new client
  io.on("connection", (socket) => {

    console.log("A user connected:", socket.data.user);
    const sessionUser=socket.data.user
    //socket.on (The Individual): Listens to one specific phone line
    const ensureThreadValid = (raw:unknown):number|null => {
      const parsedid= typeof raw ==="number"?raw:Number(raw)
      if (!Number.isInteger(parsedid)||parsedid<=0||isNaN(parsedid)) {
        console.log("Invalid thread ID:", raw);
        return null;
      }
      return parsedid;
      
    }
  
    const ensureMembership = async (threadId:number,userId: number)=>{
      if (!threadId||!userId){
        return null;
      }
      const thread=await prisma.chatThread.findUnique(
        {
           where: { id: threadId },
           select:{id:true,hostId:true,guestId:true}
       }
    )
  if(!thread){
    return null;
  }
  if (thread.hostId !== userId && thread.guestId !== userId) {
    return null;
  }
  return thread
}
//client side emit chat messsage"connection" server listen,catach and take action
socket.on("thread:join", async (payload) => {
  
     const hasObjectPayload = payload && typeof payload === "object";
     //If the payload is an object, we expect it to have a threadId property. If it's not an object, we treat the entire payload as the thread ID.
     const payloadObject = hasObjectPayload ? (payload as { threadId?: unknown }) : null;
     const rawThreadId = payloadObject ? payloadObject.threadId : payload;
     const threadid=ensureThreadValid(rawThreadId)
      if (!threadid) {
        socket.emit("chat:error", "Invalid thread ID.");
        return;
      }
      const membership=await ensureMembership(threadid,sessionUser.id)

      if (!membership) {
        socket.emit("chat:error", "You are not a member of this thread.");
        return;
      }
      if (membership.hostId===sessionUser.id){
        socket.data.role="host"
      }else{
        socket.data.role="guest"
      }
      socket.join(`thread:${threadid}`);
    }

)

socket.on("message:send", async (data) => {
  const {threadId,body}=data
  const threadid=ensureThreadValid(threadId)
  if (!threadid) {
    socket.emit("chat:error", "Invalid thread ID.");
    return;
  }
  const membership=await ensureMembership(threadid,sessionUser.id)
  if (!membership) {
    socket.emit("chat:error", "You are not a member of this thread.");
    return;
  }
  if (typeof body !== "string" || body.trim() === "") {
    socket.emit("chat:error", "Message body must be a non-empty string.");
    return;
  }
  const message=await prisma.chatMessage.create({
    //generate a new row in database
    data:{
      threadId:threadid,
      senderId:sessionUser.id,
      body:body.trim(),
    }
  })
  //this is needed 
  await prisma.chatThread.update({
    where: { id: threadid },
    data: { lastMessageAt: message.createdAt },
  })
  //io as the intercom system for the whole building(sending to all), and socket as the individual's radio.
  //io.to It looks up the key "thread:123" in its Map. It finds the list of IDs: ["Socket_A", "Socket_B"]. and send the msg
  io.to(`thread:${threadid}`) .emit("message:new",{
    id:message.id,
    threadId:message.threadId,
    senderId:message.senderId,
    body:message.body,
    createdAt:message.createdAt,
  })
})
    socket.on("disconnect", () => {
      // Add cleanup later if needed.

    });
  });

  return io;
}
