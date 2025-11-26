import React from 'react';
import { Link } from 'react-router-dom';
import "./homePage.css"

function HomePage() {
  return (
    <div className='background-container'>
      <h1>Shared-Go</h1>
      <h2>A real-time activity map</h2>
      <Link to="/map">MapPage </Link>
      <Link to="/eventDetails">EventDetailsPage </Link>
      <Link to="/personal">PersonalPage </Link>
      <Link to="/createEvent">CreateEventPage </Link>
      <Link to="/chat">ChatPage </Link>
    </div>
  );
}

export default HomePage;