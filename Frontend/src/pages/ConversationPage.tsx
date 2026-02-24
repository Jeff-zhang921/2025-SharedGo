import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ConversationPage.css";

type UserSummary = {
  id: number;
  name: string | null;
  email: string;
};

//this is same with the API with backend
type ThreadResponse = {
  id: number;
  hostId: number;
  guestId: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  host: UserSummary;
  guest: UserSummary;
  lastMessage: {
    id: number;
    body: string;
    createdAt: string;
    senderId: number;
  } | null;
};


type ConversationView = {
  threadId: number;
  name: string;
  role: "Host" | "Guest";
  preview: string;
  time: string;
  accent: string;
};

const BACKEND_URL = "http://localhost:3000";
const ACCENTS = ["#1f7a8c", "#e63946", "#7f5539", "#2a9d8f", "#5a189a", "#2d6a4f"];

const getInitials=(name:string)=>{
  const parts=name.split(" ").filter(Boolean)
  if (parts.length===0)return'Unknown'
   return parts.join(" ")
}
const formatTime=(time?:string)=>{
  if(!time)return "New"
  const date=new Date(time)
  if (Number.isNaN(date.getTime())) return "New";
  return date.toLocaleDateString();
}

const ConversationPage=()=>{
  //强制传送：用户干了某件事，你强行把他传走。
  const navigate=useNavigate()

  const [me,setme]=useState<UserSummary|null>(null)
  const[thread,setThread]=useState<ThreadResponse[]>([])
  const [status,setStatus]=useState("loading...")
  //async function is use to let function inside and outside async func to run when async is running, no need to wait
  //await only contain inside async func
  //await is use when function inside async meet await, it need to wait until the await func to finish to execute next. outside is not affected

 useEffect(()=>{
  //usecase of mount:这个组件还在屏幕上吗(is this component still on the screen), if don't, throw the data
  let isMounted=true
  const load=async()=>{
    try{
      //fetch url
        const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
          credentials: "include",
        });
        if(!meRes.ok){
          if(isMounted)setStatus("please login to see the conversation")
            return
        }

        const meData=await meRes.json()
        if(isMounted) setme(meData.user??null)

          const threadResponse=await fetch(`${BACKEND_URL}/chat/threads`,{
            credentials:"include"
          })
          if(!threadResponse.ok){
            const data=await threadResponse.json().catch(()=>{})
            if(isMounted)setStatus(data.message||"Fail to load conversation")
              return
          }
          const data=await threadResponse.json()
          if(isMounted) {
            setThread(Array.isArray(data)?data:[])
            setStatus("")
          }
    }
   catch{
            if (isMounted) setStatus("Failed to load conversations.");
  }
  }
  load()
  return()=>{
    isMounted=false
  }
 },[])



}

export default ConversationPage



