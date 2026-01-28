import React from 'react';
import {useNavigate} from 'react-router-dom';
import './createEventPage.css';
//import Button from "./../components/Button"

type EventForm = {
  title: string;
  startsAt: string;
  location: string;
  hostEmail?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  capacity?: number | "";
  category?: string;
  latitude?: number | "";
  longitude?: number | "";
};

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState<EventForm>({
    title: "",
    startsAt: "",
    location: "",
    hostEmail: "",
    description: "",
    imageUrl: "",
    externalUrl: "",
    capacity: "",
    category: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = React.useState("Error occurred: useState\n");
  const [loading, setLoading] = React.useState(false);

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
    setError("");

    try {
      const res = await fetch(`${backendBaseURL}/events/create`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          ...form,
          hostId: 1, // place-holder of Host Id
          hostEmail: "host@sharego.dev", // place-holder for Host email
          capacity: form.capacity === "" ? null:Number(form.capacity),
          latitude: form.latitude === "" ? null:Number(form.latitude),
          longitude: form.longitude === "" ? null:Number(form.longitude),
          description: form.description || null,
          category: form.category || null,
          imageUrl: form.imageUrl || null,
          externalUrl: form.externalUrl || null,
        }),
      });

      if (!res.ok) {
        const event = await res.json();
        throw new Error(event.message || "Failed to create event");
      }
     
      const createdEvent = await res.json();
      console.log("Event created:", createdEvent);

      // Redirect to event details page
      navigate(`/events/${createdEvent.event.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="event-form" onSubmit={onSubmit}>
      <header className="form-header">
        <h1>Create Event</h1>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="form-section">
        <label>
          <span>TITLE</span>
          <input name="title" placeholder="title" onChange={onChange} required/>
        </label>

        <label>
          <span>DATE</span>
          <input name="startsAt" type="datetime-local" onChange={onChange} required/>
        </label>
      
        <label>
          <span>CAPACITY</span>
          <input name="capacity" type="number" placeholder="0000" onChange={onChange}/>
        </label>

        {/*<label>
          <span>CATEGORY</span>
        </label>*/}

        <label>
          <span>LOCATION</span>
          <input name="location" placeholder="Add location" onChange={onChange} required/>
        </label>

        <label>
          <span>Description</span>
          <textarea name="description" placeholder="Description" onChange={onChange}/>
        </label>
      </section>
      
      <button className="publish-btn" type="submit"> Publish</button>
    </form>
  );
};

export default CreateEventPage;
