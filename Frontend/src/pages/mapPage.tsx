import React, { useEffect, useState, useRef } from 'react';
import "./mapPage.css"
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useSearch } from './../searchFile';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "leaflet-routing-machine";
import EventSidebar from '../components/EventDetailsSidebar';

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
  category: string;
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
  const [map, setMap] = useState<L.Map | null>(null); //State to hold the map instance
  const location = useLocation();
  const navState = location.state as { centerTo?: [number, number]; zoomTo?: number; selectedEventId?: number} | null; //recieve coords from create event page
  const hasMovedRef = useRef(false); //Prevents map moving more than once
  const [zoomLevel, setZoomLevel] = useState(13) //13 default zoom
  const { search, category, startDate, endDate } = useSearch(); //Gets real time values from the sidebar
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(navState?.selectedEventId || null); //Keep track of which event is selected


  useEffect(() => {
    //Only run if map is ready and we have coordinates
    if (map && navState?.centerTo && !hasMovedRef.current) {
      map.setView(navState.centerTo, navState.zoomTo || 16, { animate: true });
      //Lock it so it doesn't runs again
      hasMovedRef.current = true;
      //Wipe the state (bug fixing)
      window.history.replaceState({}, document.title);
    }
  }, [map, navState]); //Only re-run if the map object itself changes

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`);
      const data = await response.json();
      setDbEvents(data); // Put the events database into 'icons' state
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  useEffect(() => {
    // Fetch events from backend
    fetchEvents();
  }, []);

  useEffect(() => { //For geolocation
    //Check the browser supports Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]); //Store the users position
        },
        (error) => {
          console.error("User denied location access", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      map.setView(userLocation, 14, { animate: true }); //Move to user with an animation
    }
  }, [map, userLocation]); //Runs whenever map instance or user location changes

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
    const size = Math.max(20, Math.pow(zoomLevel, 1.6) / 1.3); //Exponential scaling to make icons grow larger or smaller dependant on zoom
    const fontSize = size * 0.15;
    return new L.DivIcon({
      className: 'custom-div-icon',
      html: `<div class="event-circle-marker" style="width: ${size}px; height: ${size}px;">
               <span style="font-size: ${fontSize}px;">${title}</span>
             </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2], //Centre circle exactly on top of coordinates
    });
  };

  //Filtering
  const filteredEvents = dbEvents.filter((event) => { //Goes through all events in the database
    const matchedSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||  //Checks if word searched is in title or description
                          event.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchedCategory = category === "" || event.category === category; //Checks event category matches category you picked

    //Date filtering
    const eventTime = new Date(event.startsAt).getTime(); //Converts date to number using .getTime()
    const startTime = startDate ? new Date(startDate).getTime() : null; //null if nothing picked
    const endTime = endDate ? new Date(endDate).getTime() : null;

    const matchedDate = (!startTime || eventTime >= startTime) && (!endTime || eventTime <= endTime);
  
    return matchedSearch && matchedCategory && matchedDate;;
  });

  return (
    <div className="map-container">
      {/* Banner to inform user how to make an event */}
      {!selectedEventId && !tempMarker && (
        <div className="map-instruction-banner">
          {zoomLevel < 12 
            ? "🔍 Zoom in to see events" 
            : "📍 Tap anywhere to create an event"}
        </div>
      )}

      <MapContainer
        center={[51.5, -2.6]} //Centre of bristol
        minZoom={3} //Stops people infinitely zooming out
        zoom={13}
        maxBounds={[[-90, -180], [90, 180]]} //Stops user scrolling too far left or right out of map
        maxBoundsViscosity={1.0}
        zoomControl={false} //Users can still zoom in and out using trackpad
        ref={setMap}
        style={{ height: "100vh", width: "100vw" }} //Takes up whole page
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" //Nicer looking map
          attribution='&copy; OpenStreetMap contributors'
          noWrap={true}
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

          {zoomLevel >= 12 && filteredEvents.map((event) => (
            <Marker 
              key={event.id} 
              position={[event.latitude, event.longitude]} 
              icon={createEventIcon(event.title)}
              eventHandlers={{
                click: () => setSelectedEventId(event.id)
              }}
            />
        ))}

          {userLocation && (
            <Marker 
              position={userLocation} 
              icon={new L.Icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', //icon
                iconSize: [25, 25]
              })}
            >
              <Popup>You are here!</Popup>
            </Marker>
          )}
    </MapContainer>
      <EventSidebar 
        eventId={selectedEventId} 
        onClose={() => setSelectedEventId(null)} 
        onDeleteSuccess={() => {
          setSelectedEventId(null); //Close the sidebar
          fetchEvents();
        }}
      />
    </div>
  );
};

export default MapPage;
