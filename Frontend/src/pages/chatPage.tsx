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

  //<> is the generic: this box is empty right now (null), but eventually, it is going to hold an object with an id, an email, and a name. Please get the memory ready for that
  const [me, setMe] = useState<{ id: number; email: string; name: string | null } | null>(null);
  const autoThreadRef=useRef(false)
//useEffect: After you finish drawing the screen, run this specific piece of code.

const [messageBody,setMessageBody]=useState("")
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


 const createThreadForHostId=async(rawHostId:number)=>{
  const parsed=Number(rawHostId)
  if (!Number.isInteger(parsed)||parsed<=0){
    setStatus("HostNumber must valid")
    return
  }
  //when you call setstatus, or set... it immediately broadcast
  try{
    const res=await fetch(`${Backend_URL}/chat/threads`,{
      method:"POST",
      headers: { "Content-Type": "application/json" },
      credentials:"include",
      body:JSON.stringify({hostId:parsed}),
    })
    const data=await res.json()
    if(!res.ok){
      setStatus(data.message||"fail to create thread")
      return
    }
    //When you call setThreadId(data.threadId), React updates its internal memory.
    setThreadId(data.threadId)
    setStatus("Thread Ready")
  }catch{
    setStatus("Failed to create thread")
  }
 }
 const handleCreateThread=async()=>{
   const parsed=Number(hostId)
   await createThreadForHostId(parsed)
 }


//i need hostId threadId from last page
//location is the suitcase that you bring other stuff into thispage
//the info is store in Ref so next time render it can stil remember
useEffect(()=>{
  const state=location.state as{hostId?:number;threadId:number}|null
  if(!state||autoThreadRef.current)return
  if(state.threadId){
    autoThreadRef.current=true
    setThreadId(state.threadId)
    setStatus("thread ready")
    return
  }
  if(state.hostId){
    autoThreadRef.current=true
    setHostId(String(state.hostId))
    createThreadForHostId(state.hostId)
  }
},[location.state])

const handleSendMessage=()=>{
  //socketRef is the container for socket
  if(!socketRef.current){
    setStatus("socket Not conencted")
    return
  }
  if (!threadId){
    setStatus("create or join a thread first")
    return
  }
  const trimmed=messageBody.trim()
  if (!trimmed){
    setStatus("mesage cannot be empty")
    return
  }
  socketRef.current.emit("message:send",{
    threadId,body:trimmed
  })
  //The message is gone; now make the paper blank again
  setMessageBody("")
}
//useMemo is the remember for react
//useMemo is for the UI: It remembers a value so that React can use it to draw the screen faster. It is used for "derived data" (data created from other data).
const headerTitle=useMemo(()=>{
  if(threadId)return `thread#${threadId}`
  return "chat"

},[threadId])

//this probably not gonna use this
const avatarLabel=useMemo(()=>{
  if(me?.email) return me.email.slice(0,1).toUpperCase()
    return "C"
},[me])




  return (
    <div >
      <main >
        <div  ref={messageListRef}>
          {threadId && (
            <div>{new Date().toLocaleString()}</div>
          )}
          {message.length === 0 && (
            <div >Start a conversation</div>
          )}
          {message.map((msg, index) => {
            const isMe = msg.senderId === me?.id;


            return (
              <div
              >
                <div>
                  <p>{msg.body}</p>
                  <span >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div >
          <button type="button" >
          </button>
          <input
            type="text"
            placeholder="Type your message"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button type="button" >
          </button>
          <button type="button" >
            Send
          </button>
        </div>
      </main>
    </div>
  );
};
export default ChatPage;