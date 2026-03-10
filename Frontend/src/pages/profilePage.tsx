import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const [tagsArr] = useState<string[]>(["Upcoming", "Past events", "Reviews"]);
  const [selectedTag, setSelectedTag] = useState<number>(0);

  // Static comment data (which can be retrieved from the API later)
  const reviewList: ReviewItem[] = [
    { id: 1, userName: "User1", msg: "Great event experience!" },
    { id: 2, userName: "User2", msg: "Highly recommended to attend!" },
  ];

  // Asynchronous acquisition of personal profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("http://localhost:3000/profile/me/overview", {
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

  // Adapt API data to card format
  const upcomingEventCards: CardItem[] = profileData?.upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.startsAt),
    image: event.imageUrl || "/watermelon.png"
  })) || [];

  const pastEventCards: CardItem[] = profileData?.pastEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.startsAt),
    image: event.imageUrl || "/watermelon.png"
  })) || [];

  // Loading/Error State Rendering
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f9fafb' 
      }}>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f9fafb',
        padding: '1.25rem'
      }}>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
      </div>
    );
  }

  // Default user data (fallback)
  const fallbackUser = { id: 0, name: "Unknown User", email: "no-email@example.com" };
  const user = profileData?.user || fallbackUser;
  const stats = profileData?.stats || { upcomingCount: 0, pastCount: 0 };

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#f9fafb', 
      fontFamily: 'sans-serif',
      overflowY: 'auto',
      boxSizing: 'border-box',
      paddingBottom: '60px' //Leave space for the bottom navigation
    }}>
      {/* Header Navigation Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </div>
        <div style={{ fontWeight: '600', fontSize: '1rem' }}>My profile</div>
        <div></div>
      </div>

      {/* Host Profile Information Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem 1.25rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ marginRight: '1.5rem' }}>
          <img
            src="/user-avatar.png"
            alt="Host Profile"
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '1px solid #e5e7eb'
            }}
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#111827' 
          }}>
            {user.name}
          </h1>
          <p style={{ 
            margin: '0.25rem 0 0.5rem 0', 
            fontSize: '0.875rem', 
            color: '#6b7280' 
          }}>
            {user.email}
          </p>
          <button style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            color: '#374151'
          }}>
            Edit Profile
          </button>
          <button
            onClick={() => navigate("/conversations")}
            style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: '#111827',
              border: '1px solid #111827',
              borderRadius: '0.375rem',
              color: '#ffffff'
            }}
          >
            Conversations
          </button>
        </div>
      </div>

      {/* User/Host Role Tags */}
      <div style={{
        padding: '0 1.25rem',
        backgroundColor: 'white',
        display: 'flex',
        gap: '0.75rem',
        paddingBottom: '1rem'
      }}>
        <span style={{
          color: '#10b981',
          fontWeight: '500',
          fontSize: '0.875rem'
        }}>User</span>
        <span style={{
          backgroundColor: 'black',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>Host</span>
      </div>

      {/* Host Statistics Cards */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'white',
        marginTop: '0.5rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Upcoming Events Stat */}
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>{stats.upcomingCount}</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>upcoming events</div>
        </div>
        
        {/* Past Events Stat */}
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>{stats.pastCount}</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>past events</div>
        </div>
        
        {/* Retain the original average rating placeholder (which can be extended from the API later) */}
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>4.1</div>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>(140 reviews)</div>
        </div>
        
        {/* Maintain the original average attendance rate placeholders (which can be expanded from the API later) */}
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>85</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>avg attendance</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        padding: '1rem 1.25rem 0',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {tagsArr.map((tag, index) => (
          <button
            key={index}
            onClick={() => setSelectedTag(index)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: selectedTag === index ? 'black' : '#f3f4f6',
              color: selectedTag === index ? 'white' : '#111827',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '120px'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Upcoming Events Section */}
      {selectedTag === 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'white',
          marginTop: '0.5rem',
          borderRadius: '0.5rem',
          margin: '0.5rem 1.25rem'
        }}>
          {upcomingEventCards.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>No upcoming events found</p>
          ) : (
            upcomingEventCards.map((card) => (
              <div key={card.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ marginRight: '1rem' }}>
                  <img
                    src={card.image || '/default-event.png'}
                    alt={card.title}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>{card.title}</h3>
                  <p style={{
                    margin: '0.25rem 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>{card.date}</p>
                  <button style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: '#374151'
                  }}>
                    Edit event
                  </button>
                </div>
              </div>
            ))
          )}

          <button style={{
            width: '100%',
            padding: '0.75rem',
            marginTop: '1rem',
            backgroundColor: '#f9fafb',
            border: '1px dashed #d1d5db',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            color: '#374151',
            fontWeight: '500'
          }}>
            + Create new event
          </button>
        </div>
      )}

      {/* Past Events Section */}
      {selectedTag === 1 && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'white',
          marginTop: '0.5rem',
          borderRadius: '0.5rem',
          margin: '0.5rem 1.25rem'
        }}>
          {pastEventCards.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>No past events found</p>
          ) : (
            pastEventCards.map((card) => (
              <div key={card.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ marginRight: '1rem' }}>
                  <img
                    src={card.image || '/default-event.png'}
                    alt={card.title}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '0.5rem',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>{card.title}</h3>
                  <p style={{
                    margin: '0.25rem 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>{card.date}</p>
                  <button style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: '#374151'
                  }}>
                    View details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Section (Retain the original static data and it can be expanded with the API in the future.) */}
      {selectedTag === 2 && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'white',
          marginTop: '0.5rem',
          borderRadius: '0.5rem',
          margin: '0.5rem 1.25rem'
        }}>
          {reviewList.map((review) => (
            <div key={review.id} style={{
              padding: '1rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <span style={{ color: '#6b7280' }}>{review.userName.charAt(0)}</span>
                </div>
                
                <h4 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>{review.userName}</h4>
              </div>
              
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#4b5563',
                paddingLeft: '50px'
              }}>{review.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
