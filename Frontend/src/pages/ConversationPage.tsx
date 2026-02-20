import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./conversationsPage.css";

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
  const navigate=useNavigate()
  const [me,setme]=useState<UserSummary|null>(null)
  const[thread,setThread]=useState<ThreadResponse[]>([])
  const [status,setStatus]=useState("loading...")





  
}





