import React from 'react'
import { Link } from "react-router-dom"
import Button from "./../components/Button"
import './eventDetailsPage.css';

const EventDetailsPage = () => {
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
