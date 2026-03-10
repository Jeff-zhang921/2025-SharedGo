
import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import "./types/express-session";
import eventsRouter from "./routes/events";
import hostsRouter from "./routes/hosts";
import authRouter from "./routes/auth";
import homeRouter from "./routes/home";
import profileRouter from "./routes/profile";
import filterRouter from "./routes/filter";
import { sessionMiddleware } from "./session";
import { initSocket } from "./socket";
import chatRouter from "./routes/chat";
import uploadRouter from "./api/upload";
import boardRouter from "./routes/board";

const app = express();
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: frontendOrigin, // frontend URL
    credentials: true, //Allows the browser to see the response and save cookies
  })
);
app.use(express.json());

app.use(sessionMiddleware);

const PORT = Number(process.env.PORT) || 3000;


//wrapping everything in /api so Nginx can route traffic easily \
const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/hosts", hostsRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/home", homeRouter);
apiRouter.use("/filter", filterRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/board", boardRouter);
apiRouter.use("/upload", uploadRouter);

apiRouter.get("/",(request:Request,response:Response)=>{
     response.json({message:"SharedGo backend running"});
});

app.use("/api", apiRouter);


// Only start the server if this file is run directly (not when imported)
//create a server and attach app to it, then pass that server to initsocket
if (require.main === module) {
  const server = http.createServer(app);
  initSocket(server);
  // the server now contain both express and socket.io
  server.listen(PORT, () => {
    console.log(`running on port ${PORT} `);
  });
}

// What app.listen(3000) does internally:
// const server = http.createServer(this);
// return server.listen(3000);

export default app; // to export app
