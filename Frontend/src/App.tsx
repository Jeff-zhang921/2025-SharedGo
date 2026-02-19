import './App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage';
import MapPage from './pages/mapPage';
import PersonalPage from './pages/personalPage';
import EventDetailsPage from './pages/eventDetailsPage';
import CreateEventPage from './pages/createEventPage';
import ChatPage from './pages/chatPage';
import HostPage from './pages/hostPage'
import HostProfile from './pages/profilePage';
import LoginPage from './pages/loginPage'
import VerifyPage from './pages/verifyPage'


function App() {
  return (
    <Routes>
      {/* set the path for the home page */}
      <Route path="/home" element={<HomePage />} />
      {/* set the path for the map page */}
      <Route path="/map" element={<MapPage />} />
      {/* set the path for the personal page */}
      <Route path="/personal" element={<PersonalPage />} />
      {/* set the path for the event details page, now with id system to route to distinct event details pages */}
      <Route path="/eventDetails/:eventId" element={<EventDetailsPage />} /> 
      {/* set the paths for the create event page */}
      <Route path="/createEvent" element={<CreateEventPage />} />
      {/* set the path for the chat page */}
      <Route path="/chat" element={<ChatPage />} />
      {/* set the path for the host page */}
      <Route path="/host/:hostId" element={<HostPage />} />
       {/* set the path for the profile page */}
      <Route path="/profile" element={<HostProfile />} />
      {/* set the path for the login page */}
      <Route path="/" element={<LoginPage />} />
      {/* set the path for the verify page */}
      <Route path="/verify" element={<VerifyPage />} />
    </Routes>

  );
}

export default App;