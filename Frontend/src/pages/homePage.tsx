import React from 'react';
import { Link } from 'react-router-dom';

// const HomePage = () => {
//   return (
//     <div>
//       <h1>Welcome to the Home Page!</h1>
//     </div>
//   );
// };


function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <Link to="/map">MapPage </Link>
      <Link to="/eventDetails">EventDetailsPage </Link>
      <Link to="/personal">PersonalPage </Link>
      <Link to="/createEvent">CreateEventPage </Link>
      <Link to="/chat">ChatPage </Link>
    </div>
  );
}

export default HomePage;