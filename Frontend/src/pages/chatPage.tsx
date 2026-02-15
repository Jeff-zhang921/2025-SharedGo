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
 if (socketRef.current)return
 const socket=io(Backend_URL,{withCredentials:true})
 socket.on("connect",()=>{
  setStatus("connected")
  if(threadId){
    socket.emit("thread:join", { threadId });
  }
 })
}

  return (
    <div>
      <h1>Welcome to the Chat Page!</h1>
    </div>
  );
};

export default ChatPage;