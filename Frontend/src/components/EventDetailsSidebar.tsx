import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import './EventDetailsSidebar.css';

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
  category: string;
  latitude: number;
  longitude: number;
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

interface EventSidebarProps {
    eventId: number | null;
    onClose: () => void;
    onDeleteSuccess: () => void;
}


const EventSidebar = ({ eventId, onClose, onDeleteSuccess }: EventSidebarProps) => {
  const navigate = useNavigate();
  const [event, setEvent]  = useState<EventData | null>(null) //Store actual event data from backend, setting initial value to null
  const [isLoading, setIsLoading] = useState(true) //Enables us to show a "loading" message to user
  const [error, setError] = useState<string | null>(null) //Store error messages during data fetching
  const [currentUser, setCurrentUser] = useState<User | null>(null) //Enables us to see who is logged-in to show the Delete Event button to host only
  const [isJoining, setIsJoining] = useState(false)

  //Code for actually fetching the data from the backend
  useEffect(() => {
    //Dont fetch when no event clicked
    if (!eventId) {
        setEvent(null);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    setEvent(null);

    //Hardcoded URL at the moment, might change later
    //Backend seems to be on port 3000 atm
    const backendBaseURL = import.meta.env.VITE_API_URL; //Change to the correct URL which the backend is running on (3000)
    const backendUrl = `${backendBaseURL}/events/${eventId}`;

    // provide current user id
    // use get("/auth/me") in the backend (to then show Delete Event button to host only)
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${backendBaseURL}/auth/me`, {credentials: "include"});
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Failed to fetch current user:", errData); 
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCurrentUser();


    const fetchEvent = async () => {
      try {
        const response = await fetch(backendUrl);
        //Error checking
        if (response.status === 404) { //Check for 404 error
             throw new Error("Event not found");
        }
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data: EventData = await response.json(); //pause here and wait for server to reply
        setEvent(data); //Puts the fetched data into the event state variable
        
      } catch (err) { //If error gets thrown
        console.error("Error:", err);
        setError("Could not load event details");
      } finally {
        setIsLoading(false); //No longer loading so set to false
      }
    };

    fetchEvent();
  }, [eventId]); //Rerun the fetching when the eventId changes (different page requires different data)

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are your sure you want to delete this event?"
    );
    if (!confirmDelete) return;

    const backendBaseURL = import.meta.env.VITE_API_URL; //Change to the correct URL which the backend is running on (3000)
    const backendUrl = `${backendBaseURL}/events/${eventId}`;
    try {
      setIsLoading(true);

      const response = await fetch(backendUrl, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete event.");
        return;
      }

      alert("Event deleted successfully.");
      onDeleteSuccess(); //Call prop to refresh map list
      onClose(); //Close sidebar
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (!event) return;
    //Check browser supports location
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
  
    //Ask for the user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const eventLat = event.latitude; //From event data
        const eventLng = event.longitude;
  
        // universal Google Maps directions URL
        // 'origin' is where the user is, 'destination' is the event
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${eventLat},${eventLng}&travelmode=walking`;
  
        //Open the link in a new tab
        window.open(url, "_blank");
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Please enable location permissions to get directions.");
      }
    );
  };

  const handleJoin = async () => {
    if (!eventId) return;
    if (!currentUser) {
      alert("Please log in to join this event.");
      return;
    }

    const backendBaseURL = import.meta.env.VITE_API_URL;
    const backendUrl = `${backendBaseURL}/events/${eventId}/join`;

    try {
      setIsJoining(true);

      const response = await fetch(backendUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.name,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.message || "Failed to join event.");
        return;
      }

      if (response.status === 201 && data.attendee) {
        setEvent((previousEvent) => {
          if (!previousEvent) return previousEvent;
          return {
            ...previousEvent,
            attendeeCount: previousEvent.attendeeCount + 1,
            attendees: [...previousEvent.attendees, data.attendee],
          };
        });
      }

      alert(data.message || "Joined the event successfully.");
    } catch (joinError) {
      console.error("Join error:", joinError);
      alert("Something went wrong.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!eventId) return;
    if (!currentUser) {
      alert("Please log in to leave this event.");
      return;
    }

    const backendBaseURL = import.meta.env.VITE_API_URL;
    const backendUrl = `${backendBaseURL}/events/${eventId}/join`;

    try {
      setIsJoining(true);

      const response = await fetch(backendUrl, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.message || "Failed to leave event.");
        return;
      }

      setEvent((previousEvent) => {
        if (!previousEvent) return previousEvent;

        const nextAttendees = previousEvent.attendees.filter(
          (attendee) => attendee.email.toLowerCase() !== currentUser.email.toLowerCase(),
        );
        const didRemoveAttendee = nextAttendees.length !== previousEvent.attendees.length;

        return {
          ...previousEvent,
          attendeeCount: didRemoveAttendee
            ? Math.max(previousEvent.attendeeCount - 1, 0)
            : previousEvent.attendeeCount,
          attendees: nextAttendees,
        };
      });

      alert(data.message || "Left the event successfully.");
    } catch (leaveError) {
      console.error("Leave error:", leaveError);
      alert("Something went wrong.");
    } finally {
      setIsJoining(false);
    }
  };

  const hasJoined = !!(
    currentUser
    && event?.attendees.some(
      (attendee) => attendee.email.toLowerCase() === currentUser.email.toLowerCase(),
    )
  );
  const isHost = currentUser?.id === event?.host?.id;

  return (
    <div className={`event-sidebar ${eventId ? 'open' : ''}`}>
    
    {/*Close Button*/}
    <button className="close-sidebar" onClick={onClose}>✕</button>

    <div className="sidebar-scroll-container">
      {isLoading && <p className="sidebar-loading">Loading event details...</p>}
      {error && <p className="sidebar-error">{error}</p>}

      {/*Only show content if data exists*/}
      {event && !isLoading && (
        <div className="event-details-container">
        <div className="title">
            <div className="category-badge">
              {event.category ?? "Other"}
            </div>
            <h1 className="event-title">{event.title}</h1>
        </div>

        <section className="event-details">
          {/*all event detail listed as shown in the design*/}
          <div className="event-info">
            <div className="event-info-row">
                <h3>DATE:</h3>
                <p>{new Date(event.startsAt).toLocaleString()}</p>
            </div>

            <div className="event-info-row">
                <h3>CAPACITY:</h3>
                <p>{event.capacity === null ? 'Unlimited' : event.capacity}</p>
            </div>

            <div className="event-info-row">
                <h3>LOCATION:</h3>
                <p>{event.location}</p>
            </div>
            <div className="event-description">
                <div className="event-info-row">
                <h3>DESCRIPTION:</h3>
                <p>{event.description || "No description provided"}</p>
                </div>
            </div>
            </div>

            
            <div className='btn-host'>
            <div className="event-image-wrapper">
              {event?.imageUrl && (
                  <img src={event.imageUrl} alt={event.title} className="event-image"/>
              )}
              <div className="web-link">
                {event?.externalUrl && (
                <a href={event.externalUrl} target="_blank" rel="noopener noreferrer">
                    Visit Event Website</a>
                )}
              </div>
            </div>

            <div className="host-info">
                <h3>HOSTED BY:</h3>
                <div className="host-details">
                <Link to={`/host/${event.host.id}`} className="host-profile-link">
                    <div className="host-text">
                        <p><strong>{event.host.name || "Anonymous Host"}</strong></p>
                        <p>{event.host.email}</p>
                    </div>
                </Link>
                </div>
            </div>

            <div className="action-buttons">
                {!isHost && (
                  <button onClick={hasJoined ? handleLeave : handleJoin} disabled={isJoining} className="btn-join">
                    {isJoining ? (hasJoined ? "Leaving..." : "Joining...") : hasJoined ? "Leave Event" : "Join Event"}
                  </button>
                )}
                <Link to={`/board/${event.id}`} className="btn-join">Event Board</Link>
                {/* If hostId matches event host, then DON'T show "chat with host" button */}
                { !isHost && (
                  <Link to="/chat" state={{ hostId: event.host.id }} className="btn-join">Chat with host</Link>
                )}
                {/* If hostId matches event host, then show "delete event" button */}
                {isHost && (
                    <button onClick={handleDelete} disabled={isLoading} className="btn-join"> 
                    {isLoading ? "Deleting...":"Delete Event"}
                    </button>
                )}
                <button onClick={handleGetDirections} className="btn-directions">Get Directions</button>

            </div>

          </div>
        </section>
        </div>
  )}
  </div>
  </div>
  );
};

export default EventSidebar;
