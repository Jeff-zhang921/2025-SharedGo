import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profilePage.css";

// Define the interface for returning data from the API
interface User {
  id: number;
  email: string;
  name: string;
}

interface Stats {
  upcomingCount: number;
  pastCount: number;
}

interface Event {
  id: number;
  title: string;
  startsAt: string;
  capacity: number;
  seatsRemaining: number;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  externalUrl: string | null;
  attendeeCount: number;
  host: {
    id: number;
    name: string;
    email: string;
  };
  isHost: boolean;
  isAttendee: boolean;
  joinedAt: string | null;
}

interface ProfileOverviewResponse {
  user: User;
  stats: Stats;
  upcomingEvents: Event[];
  pastEvents: Event[];
}

// The original card/comment interface (the comment section temporarily retains static data, which can be expanded in the future)
interface CardItem {
  id: number;
  title: string;
  date: string;
  image?: string;
}

interface ReviewItem {
  id: number;
  userName: string;
  msg: string;
}

// Date formatting tool function: Converts ISO time to a friendly prompt (such as "Starts in 3 days")
const formatEventDate = (isoDateString: string): string => {
  try {
    const eventDate = new Date(isoDateString);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Ended ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Starts today';
    if (diffDays === 1) return 'Starts tomorrow';
    return `Starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch (err) {
    return 'Date unavailable';
  }
};

// Main ProfilePage component
export default function ProfilePage() {
  const navigate = useNavigate();
  // API data status
  const [profileData, setProfileData] = useState<ProfileOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation status
  const [tagsArr] = useState<string[]>(["Upcoming events", "Past events"]);
  const [selectedTag, setSelectedTag] = useState<number>(0);

  // User/Host toggle status
  const [toggleArr] = useState<string[]>(["Events joined", "Events created"]);
  const [selectedToggle, setSelectedToggle] = useState<number>(0);

  // Static comment data (which can be retrieved from the API later)
  const reviewList: ReviewItem[] = [
    { id: 1, userName: "User1", msg: "Great event experience!" },
    { id: 2, userName: "User2", msg: "Highly recommended to attend!" },
  ];

  // Asynchronous acquisition of personal profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/me/overview`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProfileData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile data");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const filteredUpcomingEvents = profileData?.upcomingEvents.filter(event =>
    selectedToggle === 0
      ? event.isAttendee
      : event.isHost
  ) || [];

  const filteredPastEvents = profileData?.pastEvents.filter(event =>
    selectedToggle === 0
      ? event.isAttendee
      : event.isHost
  ) || [];

  // Adapt API data to card format
  const upcomingEventCards: CardItem[] = filteredUpcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.startsAt),
    image: event.imageUrl || ""
  })) || [];

  const pastEventCards: CardItem[] = filteredPastEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.startsAt),
    image: event.imageUrl || ""
  })) || [];

  // Loading/Error State Rendering
  if (loading) {
    return (
      <div className="loading">
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
        navigate("/")
    );
  }

  // Default user data (fallback)
  const fallbackUser = { id: 0, name: "Unknown User", email: "no-email@example.com" };
  const user = profileData?.user || fallbackUser;
  const stats = profileData?.stats || { upcomingCount: 0, pastCount: 0 };

  const upcomingJoinedCount =
  profileData?.upcomingEvents.filter(e => e.isAttendee).length || 0;
  const pastJoinedCount =
    profileData?.pastEvents.filter(e => e.isAttendee).length || 0;
  const upcomingCreatedCount =
    profileData?.upcomingEvents.filter(e => e.isHost).length || 0;
  const pastCreatedCount =
    profileData?.pastEvents.filter(e => e.isHost).length || 0;

  const EventList = ({
      cards, emptyMessage, onButtonClick, buttonLabel
    }: {
      cards: CardItem[];
      emptyMessage: String;
      onButtonClick?: (id: number) => void;
      buttonLabel?: String;
    }) => {
      if (cards.length === 0) {
        return <p className="empty-text">{emptyMessage}</p>;
      }
      return (
      <>
        {cards.map((card) => (
          <div key={card.id} className="event-card">
            <img
              src={card.image || "/home.svg"}
              alt={card.title}
              className="event-card-img"
            />

            <div className="event-card-content">
              <h3>{card.title}</h3>
              <p>{card.date}</p>

              {onButtonClick && (
                <button
                  onClick={() => onButtonClick(card.id)}
                  className="event-card-btn"
                >
                  {buttonLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </>
    );
  };




  return (
    <div className="profile-page-wrapper">
      <div className="profile-page">
        {/* Header Navigation Bar */}
        <div className="header">
          <div className="title">My profile</div>
              <p className="user-email">{user.email}</p>
        </div>

        {/* User/Host Role Tags */}
        <div className="role-tags">
          {/* User Navigation */}
        <div className="toggle-tabs">
          {toggleArr.map((tag, index) => (
            <button
              key={index}
              onClick={() => setSelectedToggle(index)}
              className={selectedToggle === index ? "active" : ""}
            >
              {tag}
            </button>
          ))}
        </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs">
          {tagsArr.map((tag, index) => {
            const isUpcoming = index === 0;

            const count =
              selectedToggle === 0
                ? isUpcoming
                  ? upcomingJoinedCount
                  : pastJoinedCount
                : isUpcoming
                ? upcomingCreatedCount
                : pastCreatedCount;

            return (
              <button
                key={index}
                onClick={() => setSelectedTag(index)}
                className={selectedTag === index ? "active" : ""}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>

        {/* Upcoming Events Section */}
        {selectedTag === 0 && (
          <div className="card-list">
            <EventList
              cards={upcomingEventCards}
              emptyMessage="No upcoming events found"
              onButtonClick={(id) =>
                navigate("/map", { state: { selectedEventId: id } })
              }
              buttonLabel="View event details"
            />

            {selectedToggle === 1 ? (
              // HOST VIEW
              <button
                onClick={() => navigate("/createEvent")}
                className="create-event-btn"
              >
                + Create new event
              </button>
            ) : (
              // USER VIEW
              <button
                onClick={() => navigate("/map")}
                className="create-event-btn"
              >
                Find an event &rarr;
              </button>
            )}
          </div>
        )}

        {/* Past Events Section */}
        {selectedTag === 1 && (
          <div className="card-list">
            <EventList
              cards={pastEventCards}
              emptyMessage="No past events found"
              onButtonClick={(id) =>
                navigate("/map", { state: { selectedEventId: id } })
              }
              buttonLabel="View event details"
            />
          </div>
        )}

        {/* Reviews Section */}
        {/* {selectedTag === 2 && (
          <div className="card-list">
            <EventList
              cards={[]}
              emptyMessage="No reviews found"
            />
          </div>
        )} */}
      </div>
    </div>
  );
}
