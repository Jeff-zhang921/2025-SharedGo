import express,{Request,Response} from "express";
import session from "express-session"
const app=express()
app.use(express.json())

app.use(session({
     secret:'sharego',
     //if someone just see around there is no need store them
     saveUninitialized:false,
     resave:false
}))
const PORT=3000;
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


app.get("/",(request:Request,response:Response)=>{
     console.log("base url")
     return 
})
app.listen(PORT,()=>{
    console.log(`running on port ${PORT} `)
})