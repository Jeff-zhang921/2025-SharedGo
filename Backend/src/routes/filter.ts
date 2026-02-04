import { Router,Request,Response,} from "express";
import { PrismaClient,Category } from "@prisma/client"

export const Categories = Object.values(Category);
const router=Router()
const prisma = new PrismaClient()


function calcevent(event:any,userLat:number|null,userLong:number|null){
     let distance: number | null = null;
     let attendeeCount=event.participants.length
    if (event.latitude!==null && event.longitude!==null&& userLat!==null && userLong!==null){
    distance=distanceKM(userLat,userLong,event.latitude,event.longitude)
   }
    return{
        event,
        distance:distance,
        attendeeCount:attendeeCount
    }
}
function pharseCoords(raw:unknown):number|null{
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
// if (lat1===null || long1===null || lat2===null || long2===null){
//     return null
// }
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
    const latitude=pharseCoords(req.query.latitude)
    const longitude=pharseCoords(req.query.longitude)
const hasValidCoords=latitude!==null && longitude!==null
if (hasValidCoords){
    req.session.location={latitude:latitude as number,
        longitude:longitude as number,
        updatedAt:new Date().toISOString()
    }
    const sessionlocation=req.session.location
    const userLatitude=hasValidCoords?
    latitude:
    sessionlocation?.latitude??null;
    const userLongitude=hasValidCoords?
    longitude:
    sessionlocation?.longitude??null;

    if (userLatitude===null || userLongitude===null){
        res.status(400).json({message:"Valid lat and long are required"})
        return
    }
    const events=await prisma.event.findMany({
        where:{startsAt:{gte:new Date()}},
        include:{host:true,participants:true}
    })
    const mapped=events.map(event=>calcevent(event,userLatitude ,userLongitude))
    const filtered:typeof mapped=[];
    for (const item of mapped){
        if (item.distance!==null && item.distance<=10){ //within 10 km
            filtered.push(item)
        }
    }
    res.json(filtered)
}else{
    res.status(400).json({message:"Valid lat and long are required"})
}
})



//search by name, category, location
router.get("/search",async (req:Request,res:Response)=>{
    //type of blablabla is equal to string?
const name=typeof req.query.name==="string"?req.query.name.trim():""
 const distance=typeof req.query.distance==="string"?req.query.distance.trim():""
 const category=typeof req.query.category==="string" ?req.query.category.trim():""
 const latitude=pharseCoords(req.query.latitude)
 const longitude=pharseCoords(req.query.longitude)
const attendeeCountMin=typeof req.query.attendeeCountMin==="string"?req.query.attendeeCountMin.trim():""



    const hasValidCoords=latitude!==null && longitude!==null
    if (hasValidCoords){
        req.session.location={
            latitude:latitude ,
            longitude:longitude ,
            updatedAt:new Date().toISOString()
        }
    }
    const sessionlocation=req.session.location
    const userLatitude=hasValidCoords?
    latitude:
    sessionlocation?.latitude??null;

    const userLongitude=hasValidCoords?
    longitude:
    sessionlocation?.longitude??null;
    
    const events=await prisma.event.findMany({
        where:{
            startsAt:{gte:new Date()},
        }
    ,include:{host:true,participants:true}
    })
    let distanceNum: number =Number(distance)
    let attendeeCountMinNum:number=Number(attendeeCountMin)

    let mapped= events.map(event=>calcevent(event,userLatitude,userLongitude))
    if (distance!==""&&distance!==null){
           mapped=mapped.filter((event)=>event.distance!==null && event.distance<=distanceNum)
}

    if(name!==""&&name!==null){
           mapped=mapped.filter((events)=>events.event.title.toLowerCase().includes(name.toLowerCase()))
}

 if (attendeeCountMin!==""&&attendeeCountMin!==null){
         mapped=mapped.filter((events)=>events.attendeeCount>=attendeeCountMinNum)
}

if (category!==""&&category!==null){
       mapped=mapped.filter((events)=>events.event.category===category)
}
    return res.json(mapped)
})


export default router