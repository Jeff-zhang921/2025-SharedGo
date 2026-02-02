import React from 'react';
import { Link } from 'react-router-dom';
import "./homePage.css"

function HomePage() {
  return (
    <div className='background-container'>
      <div className='top-section'>
        <h1>Shared-Go</h1>
        <h2>A real-time activity map</h2>
      </div>

      <div className='login-link'>
        <Link to="/login">Login</Link>
      </div>

      <div className='nav-links'>
      <Link to="/map">MapPage </Link>
      <Link to="/eventDetails">EventDetailsPage </Link>
      <Link to="/personal">PersonalPage </Link>
      <Link to="/createEvent">CreateEventPage </Link>
      <Link to="/chat">ChatPage </Link>
      <Link to="/profile">ProfilePage </Link>
      </div>
    </div>
  );
}

export default HomePage;