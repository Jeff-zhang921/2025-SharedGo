import "./types/express-session";
import express, { Request, Response } from "express";
import eventsRouter from "./routes/events";
import hostsRouter from "./routes/hosts";
import cors from "cors";
import authRouter from "./routes/auth";
import homeRouter from "./routes/home";
import profileRouter from "./routes/profile";
import filterRouter from "./routes/filter";
import { sessionMiddleware } from "./session";
import http from "http";
import { initSocket } from "./socket";


const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", //frontend URL
    credentials: true, //Allows the browser to see the response and save cookies
  }),
);
app.use(express.json());

app.use(sessionMiddleware);

const PORT = Number(process.env.PORT) || 3000;


app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/hosts", hostsRouter);
app.use("/profile", profileRouter);
app.use("/home", homeRouter);
app.use("/filter", filterRouter);

app.get("/",(request:Request,response:Response)=>{
     response.json({message:"SharedGo backend running"});
});

// Only start the server if this file is run directly (not when imported)
//create a server and attach app to it, then pass that server to initsocket
if (require.main === module) {
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`running on port ${PORT} `);
  });
}

// What app.listen(3000) does internally:
// const server = http.createServer(this);
// return server.listen(3000);

export default app; // to export app
