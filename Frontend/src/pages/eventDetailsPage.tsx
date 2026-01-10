import React, { useEffect, useState } from 'react'
import { Link, unstable_SerializesTo } from "react-router-dom"
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
    const backendBaseURL = 'http://localhost:3000'; //Change to the correct URL which the backend is running on
    const backendUrl = `${backendBaseURL}/events/${eventId}`;
  
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

  return (
    <div className="event-details-container">
      <div className="navigation-buttons">
        {/*back button links to map page, using react-router-dom*/}
        <Button link="/map" imgSrc="/src/assets/back.svg" text="back" size={60} className="btn-nav"/>
        {/*home button links to home page, using react-router-dom*/}
        <Button link="/" imgSrc="/src/assets/home.svg" text="home" size={60} className="btn-nav"/>
      </div>

      {/*Page Title*/}
      <section className="event-details">
        <h1 className="event-title">Event details</h1>

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
            <h3>LOCATION:</h3>
            <p>{event.location}</p>
          </div>
          <div className="event-info-row">
            <h3>DESCRIPTION:</h3>
            <div className="event-description">
              <p>{event.description || "No description provided"}</p>
            </div>
          </div>
        </div>

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
          {/*Join button links to chat page, as described in the design*/}
          <Link to="/chat" className="btn-join">Join Event</Link>
          <Link to="/host" className="btn-host">Host Details</Link>
        </div>
      </section>

      
    </div>
  )
};

export default EventDetailsPage;
