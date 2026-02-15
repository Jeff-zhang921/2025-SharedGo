import React,{useEffect,useMemo,useRef,useState} from 'react';
import{useLocation}from"react-router-dom";
import{io,type Socket}from "socket.io-client"
import"./chatPage.css"


type ChatMessage={
  id:number;
  threadId:number;
  senderId:number;
  body:string;
  createdAt:string
}
const Backend_URL="http://localhost:3000";

//TIMELINE:
//0ms	React reads useState(remember in memory).	Blank screen.
//10ms	React hits the Bottom Return.	"Not connected" (The empty shell).
//20ms	React looks back at useEffect.	[]
//30ms	connectSocket() runs.	"Not connected".
//100ms	Socket connects! setStatus("connected") is called.	"connected" (The screen updates).
//when you call setMessage,setStatus... it will rerender, rerun useEffect but if manager found it run before, and nothing change in [] so it won't run it


const ChatPage = () => {
  const location=useLocation()
  //bring extra info the previous page tried to send.
  const socketRef=useRef<Socket|null>(null);
  //useRef is like a box that holds a value, but changing what’s inside does not tell React to redraw the screen.
  const messageListRef=useRef<HTMLDivElement|null>(null)
  //change a useState value, React rerender the UI to show the new information."
  const [status,setStatus]=useState("Not connected")
  const[hostId,setHostId]=useState("")
  const [threadId,setThreadId]=useState<number|null>(null)
  const [message,setMessages]=useState<ChatMessage[]>([])
  const [me, setMe] = useState<{ id: number; email: string; name: string | null } | null>(null);
//useEffect: After you finish drawing the screen, run this specific piece of code.

const loadMe=async()=>{
  try{
    const res=await fetch(`${Backend_URL}/auth/me`,{
      credentials:"include"
    })
    if(!res.ok){
      setMe(null)
      return
    }
    const data=await res.json();
    setMe(data.user||null)
  }catch{
    setMe(null)
  }
}
const loadMessages=async(id:number)=>{
  try{
    const res = await fetch(`${Backend_URL}/chat/threads/${id}/messages`, {
     credentials: "include",
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus(data.message || "Failed to load messages.");
        return;
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setStatus("Failed to load messages.");
    }
  }
  
//connect to socket
const connectSocket=()=>{
  //check if already connect
 if (socketRef.current)return
 const socket=io(Backend_URL,{withCredentials:true})

 socket.on("connect",()=>{
  setStatus("connected")
  if(threadId){
    //tells the server put the user in the thread romm
    socket.emit("thread:join", { threadId });
  }
 })

  socket.on("connect_error", () => {
      setStatus("Socket connection error.");
    });

  socket.on("chat:error", (msg: string) => {
      setStatus(msg || "Chat error.");
    });
//socket.on is the listener
  socket.on("message:new", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
  }



    useEffect(()=>{
      loadMe();
     connectSocket();
     //when the user clicks a link to go to a different page
     return ()=>{
   if (socketRef.current){
    socketRef.current.disconnect()
    socketRef.current=null
   }
  }
//the rules say []. This means 'Only run the code inside if the stuff in these brackets has changed since the last time I was here.'"
//The Reality: "Since there is nothing in the brackets, nothing could have changed. I'm not even going to open this door. Skip it!"
    },[]);

    useEffect(()=>{
    if(!threadId||!socketRef.current) return
    socketRef.current.emit("thread:join",{threadId})
    loadMessages(threadId)
  },[threadId ])

 useEffect(()=>{
  //If the box is still empty (because the screen hasn't finished drawing), stop here
  if(!messageListRef.current)return 
  messageListRef.current.scrollTo({
    top:messageListRef.current.scrollHeight,
    behavior:"smooth"
  })
 },[message])



  return (
    <div>
      <h1>Welcome to the Chat Page!</h1>
    </div>
  );
};


export default ChatPage;