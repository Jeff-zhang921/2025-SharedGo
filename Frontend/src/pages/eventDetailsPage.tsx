import React from 'react'
import { Link } from "react-router-dom"
import Button from "./../components/Button"

const EventDetailsPage = () => {

  return (
    <div>
      <div>
        {/*back button links to map page, using react-router-dom*/}
        <Button link="/map" imgSrc="./../assets/back.svg" text="back" size={12}/>
        {/*Page Title*/}
        <h1>Event details</h1>
        {/*home button links to home page, using react-router-dom*/}
        <Button link="/" imgSrc="./../assets/home.svg" text="home" size={12}/>
      </div>

      <div>
        {/*all event detail listed as shown in the design*/}
        <h2>TITLE: title</h2>
        <h2>DATE: yyyy/mm/dd</h2>
        <h2>CAPACITY: 0000</h2>
        <h2>LOCATION: Location</h2>
        <h2>DESCRIPTION: Description goes here</h2>
        <h2>HOSTED BY: Name, contact details, profile picture</h2>
      </div>

      <div>
        {/*Join button links to chat page, as described in the design*/}
        <Link to="Chat">Join Event</Link>
      </div>
    </div>
  )
};

export default EventDetailsPage;
