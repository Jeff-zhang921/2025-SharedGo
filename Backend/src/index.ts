import "./types/express-session";
import express,{Request,Response} from "express";
import session from "express-session";
import eventsRouter from "./routes/events";
import hostsRouter from "./routes/hosts";
import cors from 'cors';
import authRouter from "./routes/auth";
import homeRouter from "./routes/home";

const app = express();
app.use(cors()) //prevent browser from blocking frontend requests
app.use(express.json());

app.use(session({
     secret:'sharego',
     //reduce load
     saveUninitialized:false,
     resave:false
}));

const PORT = Number(process.env.PORT) || 3000;


app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/hosts", hostsRouter);
app.use("/home", homeRouter);

app.get("/",(request:Request,response:Response)=>{
     response.json({message:"SharedGo backend running"});
});

// Only start the server if this file is run directly (not when imported)
if (require.main === module) {
    app.listen(PORT,()=>{
        console.log(`running on port ${PORT} `);
    });
}

export default app; // to export app
