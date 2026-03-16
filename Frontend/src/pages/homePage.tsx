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


      <div className='profile-page'>
        <Link to="/profile">
          <img src="/user-icon.png" alt="View Profile" className="profile-img" />
        </Link>
      </div>

      <div className='nav-links'>
      <Link to="/map" className="enter-button">Go! </Link>
      </div>
    </div>
  );
}

export default HomePage;