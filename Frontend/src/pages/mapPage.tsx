import React, { useEffect, useState } from 'react';
import "./mapPage.css"
import Button from '../components/Button';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  latitude: number;
  longitude: number;
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
  const navigate = useNavigate()
  const [tempMarker, setTempMarker] = useState<{lat: number, lng: number} | null>(null);
  const location = useLocation();
  const [zoomLevel, setZoomLevel] = useState(13) //13 default zoom

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

  const MapEventsHandler = () => {
    const map = useMapEvents({
      click: (e) => {
        setTempMarker({ lat: e.latlng.lat, lng: e.latlng.lng }); //Functionality to save coordinates from clicking the map
      },
      //Handle zoom updates
      zoomend: () => {
        setZoomLevel(map.getZoom());
      },
      //Get rid of popup whenever map moves or zooms (bug fix)
      zoomstart: () => {
        setTempMarker(null);
      },
      movestart: () => {
        setTempMarker(null);
      }
    });
    return null;
  };

  // Circle Icons
  const createEventIcon = (title: string) => {
    const size = Math.max(20, Math.pow(zoomLevel, 1.8) / 1.3); //Exponential scaling to make icons grow larger or smaller dependant on zoom
    const fontSize = size * 0.13;
    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `<div class="event-circle-marker" style="width: ${size}px; height: ${size}px;">
               <span style="font-size: ${fontSize}px;">${title}</span>
             </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2], //Centre circle exactly on top of coordinates
    });
  };

  return (
    <div className="map-container">
      <div className="ui-overlay">
        {/*HOME BUTTON*/}
        <div className="home-btn"
          style={{
            position: "absolute",
            top: "20px",        // Positioning 
            left: "20px",
            zIndex: 10          // layer above the map and icons
          }}
        >
          <Button
            link="/home"                // Link to the home page
            imgSrc="/src/assets/home.svg"       // Path to home icon
            text="Home"
            size={60}                       // Adjust size in pixels
          />
        </div>

        <Link to="/createEvent" className='create-event'>Create Event</Link>

        <div className='profile-page'>
          <Link to="/profile">
            <img src="/src/assets/user-icon.png" alt="View Profile" className="profile-img" />
          </Link>
        </div>
      </div>

      <MapContainer
        center={[51.5, -2.6]} //Centre of bristol
        zoom={13}
        zoomControl={false} //Users can still zoom in and out using trackpad
        style={{ height: "100vh", width: "100vw" }} //Takes up whole page
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" //Nicer looking map
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapEventsHandler />

        {tempMarker && (
          <Popup position={[tempMarker.lat, tempMarker.lng]}>
            <div style={{ textAlign: 'center' }}>
              <strong>Create Event?</strong>
              <br />
              <button 
                onClick={() => navigate('/createEvent', { state: { lat: tempMarker.lat, lng: tempMarker.lng } })}
                style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}
              >
                Add Event Here
              </button>
            </div>
          </Popup>
        )}

        {dbEvents.map((event) => (
        <Marker 
          key={event.id} 
          position={[event.latitude, event.longitude]} 
          icon={createEventIcon(event.title)}
          eventHandlers={{
            click: () => navigate(`/eventDetails/${event.id}`)
          }}
        >
        </Marker>
      ))}
    </MapContainer>
    </div>
  );
};

export default MapPage;
