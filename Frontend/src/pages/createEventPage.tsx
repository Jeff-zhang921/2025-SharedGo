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
  const [image,setImage]=useState<FormData>()
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

  const backendBaseURL = 'http://localhost:3000/api'; //Change to the correct URL which the backend is running on (3000)

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
          imageUrl: image || null,
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
 setImage(formData)
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

            <label>
              <span>DATE</span>
              <input name="startsAt" type="datetime-local" onChange={onChange} required/>
            </label>
            
            <label>
              <span>CAPACITY</span>
              <input name="capacity" type="number" placeholder="Unlimited" onChange={onChange}/>
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
              <span>Description</span>
              <textarea name="description" placeholder="No description provided" onChange={onChange}/>
            </label>
          </section>
        </form>
      </div>

      {/*Image and Website link inputs*/}
      <div className="create-event-container">
        <form className="event-form" onSubmit={onSubmit}>
          <section className="form-section">
            <label>
              <span>Image</span>
              <input type="text" placeholder="https://example.com/image.png" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})}/>
            </label>

            <label>
              <span>Website</span>
              <input type="text" placeholder="https://example.com" value={form.externalUrl} onChange={(e) => setForm({...form, externalUrl: e.target.value})}/>
            </label>
          </section>

          {/*Live Preview*/}
          <i><b>Live Preview:</b></i>
          <section className="event-details">
              <div className="event-image-wrapper">
                {form?.imageUrl && (
                  <img src={form.imageUrl} alt={form.title} className="event-image"/>
                )}
                {form?.externalUrl && (
                <a href={form.externalUrl} target="_blank" rel="noopener noreferrer">
                  Visit Event Website</a>
                )}
              </div>
          </section>
          {/*all event details listed as shown in the design*/}
          <section className="event-details">
            <div className="event-info">
              <div className="event-info-row">
                <h3>TITLE:</h3><p>{form.title}</p>
              </div>

              <div className="event-info-row">
                <h3>DATE:</h3>
                <p>{new Date(form.startsAt).toLocaleString()}</p>
              </div>

              <div className="event-info-row">
                <h3>CAPACITY:</h3>
                <p>{form.capacity === null ? 'Unlimited' : form.capacity}</p>
              </div>

              <div className="event-info-row">
                <h3>CATEGORY</h3>
                <p>{form.category ?? "Other"}</p>
              </div>

              <div className="event-info-row">
                <h3>LOCATION:</h3>
                <p>{form.location}</p>
              </div>

              <div className="event-info-row">
                <h3>DESCRIPTION:</h3>
                
              </div>
              <div className="event-description">
                  <p>{form.description || "No description provided"}</p>
              </div>
            </div>
          </section>

          {/*Publishing Tips*/}
          <div className="tips">
            <h3>Publishing Tips</h3>
            <ul>
              <li>Use a clear and descriptive event title.</li>
              <li>Add an image so the event stands out on the map.</li>
              <li>External links are perfect for ticketing or signup.</li>
            </ul>
            <Link to="/">Need to sign in?</Link>
          </div>
          
          {/*Publish Button*/}
          <button className="publish-btn" type="submit" disabled={loading}>{loading ? "Publishing...":"Publish"}</button>
        </form>
      </div>
    </div>
  );
}

export default CreateEventPage;
