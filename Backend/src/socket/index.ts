import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import sessionMiddleware from "../session";

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
  

  io.use((socket, next) => {
    (sessionMiddleware as any)(socket.request, {}, next);
  });

  io.use((socket, next) => {
    const session = (socket.request as any).session;
    const user = session?.user;
    if (!user) {
      next(new Error("Not authenticated."));
      return;
    }

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {
      // Add cleanup later if needed.
    });
  });

  return io;
}
