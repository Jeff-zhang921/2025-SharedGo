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
  const [statyss,setStatus]=useState("Not connected")
  const[hostId,setHostId]=useState("")
  const [threadId,setThreadId]=useState<number|null>(null)
  const [message,setMessages]=useState<ChatMessage[]>([])
//useEffect: After you finish drawing the screen, run this specific piece of code.



  return (
    <div>
      <h1>Welcome to the Chat Page!</h1>
    </div>
  );
};

export default ChatPage;