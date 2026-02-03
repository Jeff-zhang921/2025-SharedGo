import { Router,Request,Response } from "express";
import { PrismaClient,Category } from "@prisma/client"

const router=Router()
const prisma = new PrismaClient


function pharseCoords(raw:unknown):Number|null{
   if (typeof raw !=="string"){
    return null
   }
   const coords= Number(raw)
   if (!Number.isFinite(coords)){
    return null
   }else{
    return coords
   }
}

function distanceKM(lat1: number, long1: number, lat2: number,long2: number):number|null{
if (lat1===null || long1===null || lat2===null || long2===null){
    return null
}
const R = 6371; // Radius of the Earth in km    
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (long2 - long1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

router.get("/nearby",async (req:Request,res:Response)=>{
    const lat=pharseCoords(req.query.lat)
    const long=pharseCoords(req.query.long)
const hasValidCoords=lat!==null && long!==null
if (hasValidCoords){
    req.session.location={latitude:lat as number,
        longitude:long as number,
        updatedAt:new Date().toISOString()
    }
    const events=await prisma.event.findMany({
    })

}
    

})
//search by name, category, location
router.get("/search",async (req:Request,res:Response)=>{
    //type of blablabla is equal to string?
 const name=typeof req.query.name==="string" ?req.query.name.trim():""
 const category=typeof req.query.category==="string" ?req.query.category.trim():""
 const lat=pharseCoords(req.query.lat)
    const long=pharseCoords(req.query.long)
    if (name.length===0||!name){
        
         res.status(400).json({message:"Name query is required"})
    }
    const events=await prisma.event.findMany({
        where:{title:
            //no matter capital or not
            {contains:name,mode:"insensitive"}
        }
    })

    return res.json({events})

})


export default router