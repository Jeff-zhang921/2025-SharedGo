import React, { useEffect, useState } from 'react'
import { Link, unstable_SerializesTo, useNavigate } from "react-router-dom"
import Button from "./../components/Button"
import './eventDetailsPage.css';
import { useParams } from 'react-router-dom';

interface User {
  id: number;
  name: string | null;
  email: string
}

//Fields for the expected event data from the backend
interface EventData {
  id: number;
  title: string;
  description: string | null; //Null as doesn't have to be filled in
  startsAt: string;
  capacity: number | null;
  category: string;
  latitude: number;
  longitude: number;
  location: string;
  imageUrl: string | null;
  externalUrl: string | null;
  host: User; //Whomever hosted the event
  attendees: Array<{ //Attendees section as backend also included this (maybe implement into page later)
    id: number;
    name: string | null;
    email: string;
    joinedAt: string;
  }>;

  attendeeCount: number;
  averageRating: number | null;
}

const EventDetailsPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>(); //Use the eventId parameter from the URL

  const [event, setEvent]  = useState<EventData | null>(null) //Store actual event data from backend, setting initial value to null
  const [isLoading, setIsLoading] = useState(true) //Enables us to show a "loading" message to user
  const [error, setError] = useState<string | null>(null) //Store error messages during data fetching

  //Code for actually fetching the data from the backend
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setEvent(null);

    //Hardcoded URL at the moment, might change later
    //Backend seems to be on port 3000 atm
    const backendBaseURL = import.meta.env.VITE_API_URL; //Change to the correct URL which the backend is running on (3000)
    const backendUrl = `${backendBaseURL}/events/${eventId}`;

    // will need this code once the backend is changed to provide current user id
    // will need to add a get("/session") in the backend
    /*const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${backendBaseURL}/session`, {credentials: "include"});
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCurrentUser();*/

    const fetchEvent = async () => {
      try {
        const response = await fetch(backendUrl);
        //Error checking
        if (response.status === 404) { //Check for 404 error
             throw new Error("Event not found");
        }
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data: EventData = await response.json(); //pause here and wait for server to reply
        setEvent(data); //Puts the fetched data into the event state variable
        
      } catch (err) { //If error gets thrown
        console.error("Error:", err);
        setError("Could not load event details");
      } finally {
        setIsLoading(false); //No longer loading so set to false
      }
    };

    fetchEvent();
  }, [eventId]); //Rerun the fetching when the eventId changes (different page requires different data)

  if (isLoading) { //Message displayed while loading the event details
    return <div style={{ padding: '20px' }}><p>Loading event details: **{eventId}**...</p></div>; //Padding so msg not squashed in top left
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}><h1>Error</h1><p>{error}</p></div>;
  }

  if (!event) {
    return <div style={{ padding: '20px' }}><h1>Event Not Found</h1><p>The requested event does not exist</p></div>;
  }

  const handleDelete = async () => {
    const backendBaseURL = import.meta.env.VITE_API_URL; //Change to the correct URL which the backend is running on (3000)
    const backendUrl = `${backendBaseURL}/events/${eventId}`;
    try {
      setIsLoading(true);

      const response = await fetch(backendUrl, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete event.");
        return;
      }

      alert("Event deleted successfully.");
      navigate("/map"); //redirect to map page after deleting an event
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-details-container">
      <div className="title">
        {/*Page Title*/}
        <h1 className="event-title">Event details</h1>
      </div>

      <section className="event-details">
        {/*all event detail listed as shown in the design*/}
        <div className="event-info">
          <div className="event-info-row">
            <h3>TITLE:</h3><p>{event.title}</p>
          </div>

          <div className="event-info-row">
            <h3>DATE:</h3>
            <p>{new Date(event.startsAt).toLocaleString()}</p>
          </div>

          <div className="event-info-row">
            <h3>CAPACITY:</h3>
            <p>{event.capacity === null ? 'Unlimited' : event.capacity}</p>
          </div>

           <div className="event-info-row">
            <h3>CATEGORY</h3>
            <p>{event.category ?? "Other"}</p>
          </div>

          <div className="event-info-row">
            <h3>LOCATION:</h3>
            <p>{event.location}</p>
          </div>

          <div className="event-info-row">
            <h3>DESCRIPTION:</h3>
            
          </div>
          <div className="event-description">
              <p>{event.description || "No description provided"}</p>
          </div>
        </div>

        
        <div className='btn-host'>
          <div className="event-image-wrapper">
          {event?.imageUrl && (
            <img src={event.imageUrl} alt={event.title} className="event-image"/>
          )}
          {event?.externalUrl && (
          <a href={event.externalUrl} target="_blank" rel="noopener noreferrer">
            Visit Event Website</a>
          )}
          </div>

          {/*Links to /host/id eg. localhost:5173/host/1 which is a page that does not currently exist!*/}
          <Link to={`/host/${event.host.id}`}>
            <img src="/user-icon.png" alt="Host Details" className="profile-img" />
          </Link>
          <p className="host-details">Host Details</p>
          
          <div className="host-info">
            <h3>HOSTED BY:</h3>
            <div className="host-details">
              <div className="host-text">
                <p><strong>{event.host.name}</strong></p>
                <p>{event.host.email}</p>
              </div>
            </div>
          </div>
        
          <div className="action-buttons">
            {/* pass hostId so chat page can create/find the thread immediately */}
            <Link to="/chat" state={{ hostId: event.host.id }} className="btn-join">Join Event</Link>
            {/* IDEALLY: if hostId matches event host,, then show delete event button 
            HOWEVER: I have not worked out how to do that (I believe backend changes are necessary to get the current user id*/}
            {/*{currentUser?.id === event?.host?.id && (*insert line below in here*)*/}
              <button onClick={handleDelete} disabled={isLoading} className="btn-join"> {isLoading ? "Deleting...":"Delete Event"}</button>
            
          </div>
        </div>
      </section>
    </div>
  )
};

export default EventDetailsPage;
