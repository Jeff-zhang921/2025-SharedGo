import React from 'react'
import { Link } from "react-router-dom"
import Button from "./../components/Button"

const EventDetailsPage = () => {

  return (
    <div>
      <div>
        {/*back button links to map page, using react-router-dom*/}
        <Button link="/map" imgSrc="./../assets/back.svg" text="Go to Map Page" size={12}/>

        {/*Page Title*/}
        <div>
          <h1>Event details<h1>
        </div>     

        {/*home button links to home page, using react-router-dom*/}
        <Button link="/" imgSrc="./../assets/home.svg" text="Go to Home Page" size={12}/>
      </div>

      <div>
        {/*all event detail listed as shown in the design*/}
        <h2>TITLE: <h2><h3> title</h3>
        <h2>DATE: <h2><h3> yyyy/mm/dd</h3>
        <h2>CAPACITY: <h2><h3> 0000</h3>
        <h2>LOCATION: <h2><h3> Location</h3>
        <h2>DESCRIPTION: <h2><h3> Description goes here</h3>
        <h2>HOSTED BY: <h2><h3> Name, contact details, profile picture</h3>
      </div>

      <div>
        {/*Join button links to chat page, as described in the design*/}
        <Link to="Chat">Join Event</Link>
      </div>
    </div>
  )
};

export default EventDetailsPage;
