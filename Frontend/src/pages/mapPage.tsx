import React from 'react';
import "./mapPage.css"
import Button from '../components/Button';
import { Link } from "react-router-dom";

const MapPage = () => {
  const icons = [ //Clickable icons representing events in the area
    { id: 0, top: "40%", left: "60%", label: "📍" }, //Icon 0 - Id's used to differentiate different events (implement functionality later)
    { id: 1, top: "20%", left: "10%", label: "📍" }, //Icon 1
    { id: 2, top: "80%", left: "30%", label: "📍" }, //Icon 2
    { id: 3, top: "50%", left: "80%", label: "📍" },  //Icon 3
    { id: 4, top: "10%", left: "35%", label: "📍" },  //Icon 4
    { id: 5, top: "50%", left: "33%", label: "📍" },  //Icon 5
    { id: 6, top: "60%", left: "40%", label: "📍" }  //Icon 6
  ];

  return (
    <div className="map-container">
      {/*HOME BUTTON*/}
      <div 
        style={{
          position: "absolute",
          top: "20px",        // Positioning 
          left: "20px",
          zIndex: 10          // layer above the map and icons
        }}
      >
        <Button
          link="/"                // Link to the home page
          imgSrc="/src/assets/home.svg"       // Path to home icon
          text="Home"
          size={60}                       // Adjust size in pixels
        />
      </div>
      {icons.map((icon, idx) => (
        <Link
          key={idx}
          //to={`/eventDetails/${icon.id}`} //Different eventDetails page for different events/icons pressed (implement later)
          to={`/eventDetails`}
          style={{
            position: "absolute",
            top: icon.top,
            left: icon.left,
            cursor: "pointer",
            fontSize: "60px",
            textDecoration: 'none', //remove blue underline
          }}
        >
          {icon.label}
        </Link>
      ))}
    </div>
  );
};

export default MapPage;
