import React, { useEffect, useState } from 'react';
import "./mapPage.css"
import Button from '../components/Button';
import { Link } from "react-router-dom";

interface User {
  id: number;
  name: string | null;
  email: string
}

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
  host: User; //Whomever hosted the event
  attendees: Array<{ //Attendees section as backend also included this (maybe implement into page later)
    id: number;
    name: string | null;
    email: string;
    joinedAt: string;
  }>;

  attendeeCount: number;
  averageRating: number | null;
}


const MapPage = () => {
  const [dbEvents, setDbEvents] = useState<EventData[]>([]); //Empty array of eventdata

  //Hardcoded event positions for now, will change later
  const positionLookup: { [key: number]: { top: string; left: string } } = {
    1: { top: "40%", left: "60%" },
    2: { top: "20%", left: "10%" },
    3: { top: "80%", left: "75%" },
    4: { top: "50%", left: "80%" },
    5: { top: "50%", left: "33%" },
    6: { top: "60%", left: "40%" },
    7: { top: "10%", left: "60%" },
    8: { top: "20%", left: "90%" },
    9: { top: "44%", left: "32%" },
    10: { top: "22%", left: "76%" },
    11: { top: "10%", left: "33%" },
    12: { top: "20%", left: "40%" }
  };

  useEffect(() => {
    // Fetch events from backend
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:3000/events');
        const data = await response.json();
        setDbEvents(data); // Put the events database into 'icons' state
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };

    fetchEvents();
  }, []);

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

      <div className='create-event'>
        <Link to="/createEvent">Create Event</Link>
      </div>

      {dbEvents.map((event) => {
        // Find the coordinates for this specific DB ID
        // If the ID isn't in our lookup, give it a default middle position
        const pos = positionLookup[event.id] || { top: "50%", left: "50%" };

        return (
          <Link
            key={event.id}
            to={`/eventDetails/${event.id}`} //Uses event id from the database
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              cursor: "pointer",
              textDecoration: 'none', //remove blue underline
              transform: `translate(-50%, -100%)`, //Make sure centre of the image aligns with pins location 
              width: ICON_DIAMETER,
              height: ICON_DIAMETER,
              borderRadius: '50%',
              backgroundColor: 'white', //colour of circle event icons 
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', //Event icons look less 'flat'
              display: 'flex', //Flexbox to centre text inside circle 
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'black', fontSize: FONT_SIZE, textAlign: 'center' }}>
              {event.title} {/*Displays title from prisma*/}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default MapPage;
