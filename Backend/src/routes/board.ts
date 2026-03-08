import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import {requireSession } from "../middleware/requireSession";


const router = Router();
const prisma = new PrismaClient();


router.get("/general/:eventId",requireSession,async (req:Request,res:Response)=>{
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

router.post("/general/:eventId",requireSession,async (req:Request,res:Response)=>{
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
    if (body.length>1000){
        res.status(400).json({message:"Message body must be less than 1000 characters"})
        return
    }

    try {
        const event=await prisma.event.findUnique({
            where:{
                id:parsedEventId
            },select:{
                hostId:true,
            }
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
        
        res.status(201).json(general)
    }catch{
        res.status(500).json({ message: "Failed to post message to general board" });
        return
    }
})

router.get("/qna/:eventId",requireSession,async (req:Request,res:Response)=>{
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
                id:true,
                hostId:true,
            },
        })
        if (!event){
            res.status(404).json({message:"Event not found"})
            return
        }
        if (req.session.user?.id===undefined){
            res.status(401).json({message:"Unauthorized"})
            return
        }

        const userId = req.session.user.id;
        let isParticipant = false;
        if (event.hostId !== userId) {
            const participant = await prisma.eventParticipant.findUnique({
                where: {
                    eventId_userId: {
                        eventId: parsedEventId,
                        userId,
                    },
                },
                select: { eventId: true },
            });
            isParticipant = Boolean(participant);
        }

        if (!isParticipant && event.hostId!==userId){ 
            res.status(403).json({ message: "Only participants and host can view Q&A board messages" });
            return;
        }
        const qwitha=await prisma.question.findMany({
            where:{
                eventId:parsedEventId
            },select:{
                id:true,
                body:true,
                authorId:true,
                createdAt:true,
                answers:{
                    select:{
                        id:true,
                        body:true,
                        authorId:true,
                        createdAt:true,
                    },orderBy:{
                        createdAt:"asc"
                    }
                }
            },orderBy:{
                createdAt:"asc"
            }
        })
        res.json(qwitha)
    } catch {
        res.status(500).json({ message: "Failed to load Q&A board messages" });
    }
})
router.post("/qna/:eventId/question",requireSession,async (req:Request,res:Response)=>{
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
        res.status(400).json({message:"Question body is required"})
        return
    }
    if (body.length>1000){
        res.status(400).json({message:"Question body must be less than 1000 characters"})
        return
    }
    try {
        const event=await prisma.event.findUnique({
            where:{
                id:parsedEventId
            },select:{
                hostId:true,
            }
        })
        if (!event){
            res.status(404).json({message:"Event not found"})
            return
        }
        let isParticipant = false;
        if (event.hostId !== userId) {
            const participant = await prisma.eventParticipant.findUnique({
                where: {
                    eventId_userId: {
                        eventId: parsedEventId,
                        userId,
                    },
                },
                select: { eventId: true },
            });
            isParticipant = Boolean(participant);
        }

        if (!isParticipant && event.hostId!==userId){
            res.status(403).json({ message: "Only participants and host can post questions to the Q&A board" });
            return;
        }
        const question=await prisma.question.create({
            data:{
                eventId:parsedEventId,
                body:body,
                authorId:userId
            }
        })
        res.status(201).json(question)
    }catch{
        res.status(500).json({ message: "Failed to post question to Q&A board" });
        return
    }
})

router.post("/qna/:eventId/answer",requireSession,async (req:Request,res:Response)=>{
    const userId=req.session.user?.id
    if(!userId){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    const parsedEventId = Number(req.params.eventId);
    if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
        res.status(400).json({ message: "Valid eventId is required" });
        return;
    }
    const questionIdRaw=req.body?.questionId
    const questionId=typeof questionIdRaw==="number"||typeof questionIdRaw==="string"?Number(questionIdRaw):NaN
    if (!Number.isInteger(questionId)||questionId<=0){
        res.status(400).json({message:"Valid questionId is required"})
        return
    }
    const body=typeof req.body?.body==="string"?req.body.body.trim():""
    if (!body){
        res.status(400).json({message:"Answer body is required"})
        return
    }
    if (body.length>1000){
        res.status(400).json({message:"Answer body must be less than 1000 characters"})
        return
    }
    try {
        const event=await prisma.event.findUnique({
            where:{
                id:parsedEventId
            },select:{
                hostId:true,
            }
        })
        if (!event){
            res.status(404).json({message:"Event not found"})
            return
        }
        let isParticipant = false;
        if (event.hostId !== userId) {
            const participant = await prisma.eventParticipant.findUnique({
                where: {
                    eventId_userId: {
                        eventId: parsedEventId,
                        userId,
                    },
                },
                select: { eventId: true },
            });
            isParticipant = Boolean(participant);
        }
        if (event.hostId !== userId && !isParticipant) {
            res.status(403).json({ message: "Only the event host and participants can post answers to the Q&A board" });
            return;
        }
        const question=await prisma.question.findUnique({
            where:{
                id:questionId
            },select:{
                id:true,
                eventId:true,
            }
        })
        if (!question||question.eventId!==parsedEventId){
            res.status(404).json({message:"Question not found for this event"})
            return
        }
        const answer=await prisma.answer.create({
            data:{
                questionId,
                body,
                authorId:userId
            }
        })
        res.status(201).json(answer)
    }catch{
        res.status(500).json({ message: "Failed to post answer to Q&A board" });
        return
    }
})
export default router
