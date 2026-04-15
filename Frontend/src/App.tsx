import './App.css';
import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from './pages/homePage';
import MapPage from './pages/mapPage';
//import EventDetailsPage from './pages/eventDetailsPage';
import CreateEventPage from './pages/createEventPage';
import ChatPage from './pages/chatPage';
import HostPage from './pages/hostPage'
import HostProfile from './pages/profilePage';
import LoginPage from './pages/loginPage'
import VerifyPage from './pages/verifyPage'
import ConversationsPage from './pages/ConversationPage';
import BoardPage from './pages/boardPage';
import Navigation from "./components/Navigation";

function NavBar() {
  return (
    <>
      <aside className="navbar">
        <Navigation/>
      </aside>

      <div className="page-content">
        <Outlet/>
      </div>
    </>
  )
}

function App() {
  return (
    <Routes>
      {/* NO NAVBAR*/}
      <Route path="/" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />

      {/*NAVBAR IMPLEMENTED (gap left/bottom if landscape/portrait)*/}
      <Route element={<NavBar/>}>
        <Route path="/map" element={<MapPage />} />
        {/* set the path for the event details page, now with id system to route to distinct event details pages */}
        
        {/* set the paths for the create event page */}
        <Route path="/createEvent" element={<CreateEventPage />} />
        {/* set the path for the host page */}
        <Route path="/host/:hostId" element={<HostPage />} />
        <Route path="/board/:eventId" element={<BoardPage />} />
        {/* set the path for the profile page */}
        {/* set the path for the profile, conversations and chat pages */}
        <Route path="/profile" element={<HostProfile />} />
        <Route path="/conversations" element={<ConversationsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
