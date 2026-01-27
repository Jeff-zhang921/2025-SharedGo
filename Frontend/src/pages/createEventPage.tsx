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
  const onChange = (newEvent: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name, value} = newEvent.target;
    setForm((previous) => ({...previous, [name]:value}));
  };

  // handle submition of the form
  const onSubmit = async (newEvent: React.FormEvent) => {
    newEvent.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/events/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          ...form,
          hostId: 1, // place-holder of Host
          hostEmail: "host@sharego.dev", // place-holder for Host
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
      navigate(`/events/${createdEvent.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h1>Create Event</h1>
      {error && <p>{error}</p>}

      <input name="title" placeholder="Title" onChange={onChange} required />
      <input
        name="startsAt"
        type="datetime-local"
        onChange={onChange}
        required
      />
      <input
        name="location"
        placeholder="Location"
        onChange={onChange}
        required
      />
      <input
        name="capacity"
        type="number"
        placeholder="Capacity"
        onChange={onChange}
      />
      <textarea
        name="description"
        placeholder="Description"
        onChange={onChange}
      />

      <button>Create</button>
    </form>
  );
};

export default CreateEventPage;
