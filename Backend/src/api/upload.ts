import{Router,Request,Response} from "express"
import { UTApi, UTFile } from "uploadthing/server";
import multer from "multer";
import { error } from "console";
const utapi = new UTApi();

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
//multer Populates req.file(neat JavaScript Object)
//When you use multer({ storage: multer.memoryStorage() }), it automatically adds a property(req.file) to the  (request) object
const upload = multer({
    //No File Created: The file is never written to your server's uploads/ folder.
    //The "Buffer": The file data is stored in a Buffer object inside req.file.buffer.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
});

const router=Router()
//workflow:assign the type of file,, use UTFile change them to format that UploadThing API can accept, then call the API to upload the file, and get the upload.data which contain the url of the file by calling .ufsUrl
router.post("/upload-image",upload.single("file"),async (req:Request,res:Response)=>{
    if (!req.file){
        res.status(400).json({message:"No file uploaded"})
        return
    }
    if(!process.env.UPLOADTHING_SECRET_KEY){
        res.status(500).json({message:"Server misconfiguration"})
        return
    }
    if (!req.session.user){
        res.status(401).json({message:"Unauthorized"})
        return
    }
    const file=req.file as Express.Multer.File
    const isVideo = file.mimetype.startsWith('video/')
    const isImage=file.mimetype.startsWith('image/')
    if (!isImage&&!isVideo){
        res.status(400).json({message:"Only image and video files are allowed"})
        return
    }
   if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ message: "File size exceeds the limit of 10MB." });
    return 
   }
   try{
    if (isVideo||isImage){
      //new UTFile(parts, name, options)
      //Multer’s in-memory data to “byte array”
      const uploadFile=new UTFile([file.buffer as BlobPart],file.originalname||`chat${Date.now()}`,{
      type:file.mimetype,
      lastModified:Date.now()
      })
      //Calls UploadThing’s API to upload the file
      const upload=await utapi.uploadFiles(uploadFile)
      //upload can return a single result object (if you pass one file), or array of result objects (if you pass multiple files)
      const uploadedData=Array.isArray(upload)?upload[0]?.data:upload.data
      const uploadedErr=Array.isArray(upload)?upload[0]?.error:upload.error
      if(uploadedErr||!uploadedData){
        console.error("UploadThing API error:", uploadedErr);
        res.status(500).json({ message: "Failed to upload file" });
        return
      }
     const url=uploadedData.ufsUrl??uploadedData.url
     if (!url){
        console.error("UploadThing API error: No URL returned");
        res.status(500).json({ message: "Failed to upload file" });
        return
     }
      res.json({url})

    }
  }catch (err){
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to upload file" });
   }
   
  })


