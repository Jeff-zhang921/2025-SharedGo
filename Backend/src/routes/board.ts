import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";

const router = Router();
const prisma = new PrismaClient();


router.get("/general/:eventId",async (req:Request,res:Response)=>{
    const parsedEventId = Number(req.params.eventId);
    if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
        res.status(400).json({ message: "Valid eventId is required" });
        return;
    }

    try {
        const event=await prisma.event.findUnique({
            where:{
                id:parsedEventId
            },select:{
                id:true
            }
        })

        if (!event){
            res.status(404).json({message:"Event not found"})
            return
        }
        const general=await prisma.general.findMany({
            where:{
                eventId:parsedEventId
            },select:{
                id:true,
                body:true,
                createdAt:true,
            },orderBy:{
                createdAt:"asc"
            }
        })
        res.json(general)
    } catch {
        res.status(500).json({ message: "Failed to load general board messages" });
    }
})

router.post("/general/:eventId",async (req:Request,res:Response)=>{
    const userId=req.session.user?.id
    if (!userId){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    const parsedEventId = Number(req.params.eventId);
    if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
        res.status(400).json({ message: "Valid eventId is required" });
        return;
    }
    const body=typeof req.body?.body==="string"?req.body.body.trim():""
    if (!body){
        res.status(400).json({message:"Message body is required"})
        return
    }
    try {
        const event=await prisma.event.findUnique({
            where:{
                id:parsedEventId
            },
        })
        if (!event){
            res.status(404).json({message:"Event not found"})
            return
        }
        if (event?.hostId !== userId) {
            res.status(403).json({ message: "Only the event host can post messages to the general board" });
            return;
        }
        const general=await prisma.general.create({
            data:{
                eventId:parsedEventId,
                body:body,
                authorId:userId
            }
        })
        if (!general){
            res.status(500).json({ message: "Failed to post message to general board" });
            return
        }
        res.status(201).json(general)
    }catch{
        res.status(500).json({ message: "Failed to post message to general board" });
        return
    }
}

)
export default router
