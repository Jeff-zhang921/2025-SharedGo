import './App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage';
import MapPage from './pages/mapPage';
import PersonalPage from './pages/personalPage';
import EventDetailsPage from './pages/eventDetailsPage';
import CreateEventPage from './pages/createEventPage';
import ChatPage from './pages/chatPage';
import HostPage from './pages/hostPage'


function App() {
  return (
    <Routes>
      {/* set the path for the home page */}
      <Route path="/" element={<HomePage />} />
      {/* set the path for the map page */}
      <Route path="/map" element={<MapPage />} />
      {/* set the path for the personal page */}
      <Route path="/personal" element={<PersonalPage />} />
      {/* set the path for the event details page, now with id system to route to distinct event details pages */}
      <Route path="/eventDetails/:eventId" element={<EventDetailsPage />} /> 
      {/* set the paths for the create event page */}
      <Route path="/createEvent" element={<CreateEventPage />} />
      <Route path="/event/create" element={<CreateEventPage />} />
      {/* set the path for the chat page */}
      <Route path="/chat" element={<ChatPage />} />
      {/* set the path for the host page */}
      <Route path="/host" element={<HostPage />} />
    </Routes>

  );
}

export default App;