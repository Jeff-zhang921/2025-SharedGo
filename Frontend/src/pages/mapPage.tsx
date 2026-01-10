import React from 'react';
import "./mapPage.css"
import Button from '../components/Button';
import { Link } from "react-router-dom";

const MapPage = () => {
  const icons = [ //Clickable icons representing events in the area
    { id: 0, top: "40%", left: "60%", title: "5-a-side"}, //Icon 0 - Id's used to differentiate different events (implement functionality later)
    { id: 1, top: "20%", left: "10%", title: "Concert"}, //Icon 1
    { id: 2, top: "80%", left: "75%", title: "CSS social"}, //Icon 2
    { id: 3, top: "50%", left: "80%", title: "Cake baking"},  //Icon 3
    { id: 4, top: "50%", left: "33%", title: "DJ set"},  //Icon 4
    { id: 5, top: "60%", left: "40%", title: "Coffee social"}  //Icon 5
  ];

  const ICON_DIAMETER = 100; // Diameter of the circle in pixels
  const FONT_SIZE = '16px';

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
          to={`/eventDetails/${icon.id}`} //Different eventDetails page for different events/icons pressed (implement later)
          style={{
            position: "absolute",
            top: icon.top,
            left: icon.left,
            cursor: "pointer",
            textDecoration: 'none', //remove blue underline
            transform: `translate(-50%, -100%)`, //Make sure centre of the image aligns with pins location
            width: ICON_DIAMETER,
            height: ICON_DIAMETER,
            borderRadius: '50%',
            backgroundColor: 'white', //colour of circle event icons
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)', //Event icons look less 'flat'

            //Flexbox to centre text inside circle
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Black text content */}
          <span 
            style={{
              color: 'black',
              fontSize: FONT_SIZE,
              fontWeight: 'normal',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon.title}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default MapPage;
