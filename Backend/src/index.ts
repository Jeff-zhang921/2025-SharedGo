import express,{Request,Response} from "express";
import session from "express-session";
import eventsRouter from "./routes/events";
import 'dotenv/config'; // fetch .env variables


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
      name: string;
      age: number;
      password: string;
    };
    // add more custom fields as needed
  }
}


app.use("/events", eventsRouter);

app.get("/",(request:Request,response:Response)=>{
     response.json({message:"ShareGo backend running"});
});

export default app; // to export app

app.listen(PORT,()=>{
    console.log(`running on port ${PORT} `);
});
