import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage';
import MapPage from './pages/mapPage';
import PersonalPage from './pages/personalPage';
import EventPage from './pages/eventPage';


{/* Setting up react router for navigation */}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* set the path for the home page */}
        <Route path="/" element={<HomePage />} />
        
        {/* set the path for the map page */}
        <Route path="/map" element={<MapPage />} />
        
        {/* set the path for the personal page */}
        <Route path="/profile" element={<PersonalPage />} />

        {/* set the path for the event page */}
        <Route path="/profile" element={<EventPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
