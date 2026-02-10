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
socket.on("thread:join", async (threadIdRaw) => {
     const thread=ensureThreadValid(threadIdRaw)
      if (!thread) {
        socket.emit("error", "Invalid thread ID.");
        return;
      }
      
})



    socket.on("disconnect", () => {
      // Add cleanup later if needed.

    });
  });

  return io;
}
