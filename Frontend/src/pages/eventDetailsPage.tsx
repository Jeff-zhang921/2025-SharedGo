import React from 'react'
import Heading from  "../components/Heading"
import { Section } from "../components/Section"
import { Link } from "react-router-dom"
import Button from "./../components/Button"

const EventDetailsPage = () => {

  return (
    <div>
      <div>
        {/*back button links to map page, using react-router-dom*/}
        <Button link="/map" imgSrc="./../assets/back.svg" text="Go to Map Page" size={12}/>

        {/*Page Title*/}
        <Heading title={"Event details\n"}/>

        {/*home button links to home page, using react-router-dom*/}
        <Button link="/" imgSrc="./../assets/home.svg" text="Go to Home Page" size={12}/>
      </div>

      <div>
        {/*all event detail listed as shown in the design*/}
        <Section>title={"TITLE"}title</Section>
        <Section>title={"DATE"}yyyy/mm/dd</Section>
        <Section>title={"CAPACITY"}0000</Section>
        <Section>title={"LOCATION"}Location</Section>
        <Section>title={"DESCRIPTION\n"}Description goes here</Section>
      </div>

      <div>
        <Section>title={"HOSTED BY"}Name, contact details, profile picture</Section>
      </div>

      <div>
        {/*Join button links to chat page, as described in the design*/}
        <Link to="Chat">Join Event</Link>
      </div>
    </div>
  )
};

export default EventDetailsPage;
