import './App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage';
import MapPage from './pages/mapPage';
import PersonalPage from './pages/personalPage';
import EventPage from './pages/eventPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/personal" element={<PersonalPage />} />
      <Route path="/event" element={<EventPage />} />
    </Routes>
  );
}

export default App;