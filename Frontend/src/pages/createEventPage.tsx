import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import './createEventPage.css';
//import Button from "./../components/Button"

type EventForm = {
  title: string;
  description?: string;
  startsAt: string;
  location: string;
  hostEmail?: string;
  imageUrl?: string;
  externalUrl?: string;
  capacity?: number | "";
  category?: string;
  latitude?: number | "";
  longitude?: number | "";
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
    latitude: "",
    longitude: "",
    //Attendees section as backend also included this (maybe implement into page later)
    attendees: [],
    attendeeCount: 0,
    averageRating: null,
  });
  const [loading, setLoading] = useState(false);

  // handle changes on input
  const onChange = (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name, value} = event.target;
    setForm((previous) => ({...previous, [name]:value}));
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
        body: JSON.stringify({
          ...form,
          hostId: 1, // place-holder of Host Id
          hostEmail: "host@sharego.dev", // place-holder for Host email
          capacity: form.capacity === "" ? null:Number(form.capacity),
          latitude: 1,
          longitude: 2,
          description: form.description || null,
          category: form.category || undefined,
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
      navigate(`/eventDetails/${createdEvent.event.id}`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <input name="category" placeholder="None" onChange={onChange}/>
        </label>

        <label>
          <span>LOCATION</span>
          <input name="location" placeholder="Add location" onChange={onChange} required/>
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" placeholder="No description provided" onChange={onChange}/>
        </label>
      </section>
      
      <button className="publish-btn" type="submit"> Publish</button>
    </form>
  );
};

export default CreateEventPage;
