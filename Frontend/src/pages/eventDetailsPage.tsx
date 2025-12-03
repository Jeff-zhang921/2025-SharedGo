import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom"
import Button from "./../components/Button"
import './eventDetailsPage.css';
import { useParams } from 'react-router-dom';


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
  //Maybe include host here or maybe in seperate interface
}

const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>(); //Use the eventId parameter from the URL

  const [event, setEvent]  = useState<EventData | null>(null) //Store actual event data from backend, setting initial value to null
  const [isLoading, setIsLoading] = useState(true) //Enables us to show a "loading" message to user
  const [error, setError] = useState<string | null>(null) //Store error messages during data fetching

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
            <h3>TITLE:</h3><p>Example title</p>
          </div>

          <div className="event-info-row">
            <h3>DATE:</h3>
            <p>example date</p>
          </div>

          <div className="event-info-row">
            <h3>CAPACITY:</h3>
            <p>example capacity</p>
          </div>
          <div className="event-info-row">
            <h3>LOCATION:</h3>
            <p>example location</p>
          </div>
          <div className="event-info-row">
            <h3>DESCRIPTION:</h3>
            <div className="event-description">
              <p> Example event description goes here.</p>
            </div>
          </div>
        </div>

          <div className="host-info">
          <h3>HOSTED BY:</h3>
          <div className="host-details">
            <div className="host-text">
              <p><strong>Mike Rosoft</strong></p>
              <p>mike@example.com</p>
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
