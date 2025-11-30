import express,{Request,Response} from "express";
import session from "express-session";
import eventsRouter from "./routes/events";
import hostsRouter from "./routes/hosts";
import authRouter from "./routes/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // allow basic form submissions for create-event flow

app.use(session({
     secret:'sharego',
     //if someone just see around there is no need store them
     saveUninitialized:false,
     resave:false
}));

const PORT = Number(process.env.PORT) || 3000;
declare module 'express-session' {
  interface SessionData {
    visited?: boolean;
    user?: {
      id: number;
      email: string;
      name: string | null;
    };
    // add more custom fields as needed
  }
}

app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/hosts", hostsRouter);

app.get("/",(request:Request,response:Response)=>{
     response.json({message:"ShareGo backend running"});
});

// Only start the server if this file is run directly (not when imported)
if (require.main === module) {
    app.listen(PORT,()=>{
        console.log(`running on port ${PORT} `);
    });
}

export default app; // to export app
