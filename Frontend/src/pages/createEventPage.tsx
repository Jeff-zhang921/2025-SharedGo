import React, {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import './createEventPage.css';
//import Button from "./../components/Button"

type EventForm = {
  title: string;
  description?: string;
  startsAt: string;
  location: string;
  hostEmail: string;
  capacity?: number | "";
  category: string;
  latitude: number;
  longitude: number;
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
    latitude: initialCoords?.lat || 0, //Use coordinates from map or default to zero
    longitude: initialCoords?.lng || 0,
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

  const backendBaseURL = 'http://localhost:3000'; //Change to the correct URL which the backend is running on (3000)

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

  return (
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

        <label>
          <span>CATEGORY</span>
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
        </label>

          <label>
            <span>LOCATION</span>
            <input name="location" placeholder="Add location" onChange={onChange} required/>
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
          <span>Image</span>
          <input type="text" placeholder="https://example.com/image.png" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})}/>
        </label>

        <label>
          <span>Website</span>
          <input type="text" placeholder="https://example.com" value={form.externalUrl} onChange={(e) => setForm({...form, externalUrl: e.target.value})}/>
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" placeholder="No description provided" onChange={onChange}/>
        </label>
      </section>
      
      <button className="publish-btn" type="submit" disabled={loading}>{loading ? "Publishing...":"Publish"}</button>
    </form>
    </div>
  );
};

export default CreateEventPage;
