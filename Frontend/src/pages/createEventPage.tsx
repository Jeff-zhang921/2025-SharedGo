import React, {ChangeEvent,useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import './createEventPage.css';


type EventForm = {
  title: string;
  description?: string;
  startsAt: string;
  location?: string;
  hostEmail: string;
  capacity?: number | "";
  category: string;
  latitude: number | "";
  longitude: number | "";
  imageUrl?: string;
  externalUrl?: string;
  attendees?: Array<{ //Attendees section as backend also included this (maybe implement into page later)
    id?: number;
    name?: string | null;
    email?: string;
    joinedAt?: string;
  }>;
  attendeeCount?: number;
  averageRating?: number | null;
};

const CreateEventPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
   const MAX_UPLOAD=100*1024*1024
  const [status,setStatus]=useState("")
  const initialCoords = location.state as { lat: number; lng: number } | null; //getting lat/long from navigation state

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    startsAt: "",
    location: "",
    hostEmail: "",
    imageUrl: "",
    externalUrl: "",
    capacity: "",
    category: "",
    latitude: initialCoords?.lat ?? "", //Use coordinates from map or default to zero
    longitude: initialCoords?.lng ?? "",
    //Attendees section as backend also included this (maybe implement into page later)
    attendees: [],
    attendeeCount: 0,
    averageRating: null,
  });
  const [loading, setLoading] = useState(false);
  const isUploadSuccess = status === "Image uploaded";

  // handle changes on input
  const onChange = (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const {name, value} = event.target;
    if (name === "capacity" || name === "latitude" || name === "longitude") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
    setForm((previous) => ({...previous, [name]:value}));
    }
  };

  const backendBaseURL = import.meta.env.VITE_API_URL; //Change to the correct URL which the backend is running on (3000)

  // handle submition of the form
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    

    try {
      const res = await fetch(`${backendBaseURL}/events/create`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({
          ...form,
          capacity: form.capacity === "" ? null:form.capacity,
          latitude: form.latitude,
          longitude: form.longitude,
          description: form.description || null,
          category: form.category,
          imageUrl: form.imageUrl || null,
          externalUrl: form.externalUrl || null,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("Create event failed:", text);
        throw new Error(text || "Failed to create event");
      }
      const createdEvent = JSON.parse(text);

      // Redirect to event details page
      navigate(`/map`, {
        state: { 
          centerTo: [form.latitude, form.longitude], 
          zoomTo: 15 
        }
      });
      //navigate(`/eventDetails/${createdEvent.event.id}`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const handleSendFile=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]
    if(!file){
  return 
}
if(!file.type.startsWith("image/")){
  setStatus("Only image files are allowed")
  return
}
if (file.size>MAX_UPLOAD){
  setStatus("Image can not exceed 100mb")
  return
}
const formData=new FormData()
//this related to the backend ,upload.single("file")
formData.append("file",file)
 setStatus("Uploading image...");
 try{
  const response=await fetch(`${backendBaseURL}/upload/upload`,{
    method:"POST",
    credentials:"include",
    body:formData
  })
  const raw=await response.text()
  //like hashmap
  let data:Record<string,string>={}
  if(raw){
    try{
      data=JSON.parse(raw) as Record<string,string>
    }catch{
      data={}
    }
  }
  if(!response.ok){
      const serverMessage = typeof data.message === "string" ? data.message : "";
      setStatus(
        serverMessage || data.error|| `Fail to upload image(HTTP ${response.status}).`
      )
      return
    }
     const imageURL=typeof data.url ==="string"?data.url.trim():""
    if(!imageURL){
      setStatus("upload success but url missing")
      return
    }
    setForm((previous) => ({
      ...previous,
      imageUrl: imageURL,
    }));
    setStatus("Image uploaded");
 }catch{
  setStatus("Failt ot upload")
 }finally{
  event.target.value=""
 }
}




  return (
    <div className="create-event-layout">
      {/*Create Event Form*/}
      <div className="create-event-container">
        <form className="event-form" onSubmit={onSubmit}>
          <header className="form-header">
            <h1>Create Event</h1>
          </header>

          <section className="form-section">
            <label>
              <span>TITLE</span>
              <input name="title" placeholder="Title" onChange={onChange} required/>
            </label>

            <label className= "select-field">
              <span>CATEGORY</span>
              <div className="select-wrapper">
                <select name="category" value={form.category} onChange={onChange}>
                  <option value="">Select Category</option>
                  <option value="Physical_Activities">Physical Activities</option>
                  <option value="Festivals">Festivals</option>
                  <option value="Educational">Educational</option>
                  <option value="Networking">Networking</option>
                  <option value="Arts_Culture">Arts & Culture</option>
                  <option value="Food_Drink">Food & Drink</option>
                  <option value="Music_Concerts">Music & Concerts</option>
                  <option value="Tech_Gaming">Tech & Gaming</option>
                  <option value="Wellness_Meditation">Wellness & Meditation</option>
                  <option value="Volunteer_Charity">Volunteer & Charity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </label>

            <label>
              <span>DATE</span>
              <input name="startsAt" type="datetime-local" onChange={onChange} required/>
            </label>
            
            <label>
              <span>CAPACITY</span>
              <input name="capacity" type="number" placeholder="Unlimited" onChange={onChange}/>
            </label>

            <label>
              <span>LOCATION</span>
              <input name="location" placeholder="Add location" onChange={onChange}/>
            </label>

            <label>
              <span>LATITUDE</span>
              <input name="latitude" type="number" step="any" placeholder="e.g. 51.4561" value={form.latitude} onChange={onChange} required/>
            </label>

            <label>
              <span>LONGITUDE</span>
              <input name="longitude" type="number" step="any" placeholder="e.g. 2.6031" value={form.longitude} onChange={onChange} required/>
            </label>

            <label>
              <span>DESCRIPTION</span>
              <textarea name="description" placeholder="No description provided" onChange={onChange}/>
            </label>

            {/*Image and Website link inputs*/}
              <div className="image-upload">
                <span>+ Add image</span>
                <input
                  id="event-photo-upload"
                  className="photo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleSendFile}
                />
              </div>
            
            
              <div className="website-link-box">
                <span>Add event website link:</span>
                <input
                  name="externalUrl"
                  className="photo-upload-input"
                  type="url"
                  placeholder="https://example.com"
                  value={form.externalUrl}
                  onChange={onChange}
                />
              </div>
          </section>
        </form>
      </div>

      
      <div className="create-event-container">
        <form className="event-form" onSubmit={onSubmit}>
          {/*Live Preview*/}
          <div className="preview-title">
            <i><b>Live Preview:</b></i>
          </div>
          {/*all event details listed as shown in the design*/}
          <h1 className="event-title">Event details</h1>
          <section className="event-details">
            <div className="category-badge">
              {form.category ?? "Other"}
            </div>
            <div className="event-info">
              <div className="event-info-row">
                <h3>TITLE:</h3><p>{form.title || "No title provided"}</p>
              </div>

              <div className="event-info-row">
                <h3>DATE:</h3>
                <p>{form.startsAt ? new Date(form.startsAt).toLocaleString() : "TBC"}</p>
              </div>

              <div className="event-info-row">
                <h3>CAPACITY:</h3>
                <p>{form.capacity === "" || form.capacity === null ? 'Unlimited' : form.capacity}</p>
              </div>

              <div className="event-info-row">
                <h3>LOCATION:</h3>
                <p>{form.location || "No location provided"}</p>
              </div>

              <div className="event-info-row">
                <h3>DESCRIPTION:</h3>
                <p>{form.description || "No description provided"}</p>
              </div>
            </div>

            <div className="event-image-wrapper">
              {form?.imageUrl && (
                <img src={form.imageUrl} alt={form.title} className="event-image"/>
              )}

              <div className="web-link">
                {form?.externalUrl && (
                  <a className="web-link" href={form.externalUrl} target="_blank" rel="noopener noreferrer">Visit Event Website</a>
                )}
              </div>
            </div>
          </section>

          {/*Publishing Tips*/}
          <div className="tips">
            <h3>Publishing Tips</h3>
            <ul>
              <li>Use a clear and concise event title.</li>
              <li>Add an image so the event stands out.</li>
              <li>Use a detailed description so users know what to expect.</li>
            </ul>
            <div className="signin">
              <Link className="signin-btn" to="/">Need to sign in?</Link>
            </div>
          </div>
          {/*Publish Button*/}
          <button className="publish-btn" type="submit" disabled={loading}>{loading ? "Publishing...":"Publish"}</button>
        </form>
      </div>
    </div>
  );
}

export default CreateEventPage;
