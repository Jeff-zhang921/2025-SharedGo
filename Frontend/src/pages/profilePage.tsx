import { useState } from "react";

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

export default function ProfilePage() {
  const [tagsArr] = useState<string[]>(["Upcoming", "Past events", "Reviews"]);
  const [selectedTag, setSelectedTag] = useState<number>(0);

  const upcomingEventCards: CardItem[] = [];
  const pastEventCards: CardItem[] = [];
  
  const reviewList: ReviewItem[] = [
    { id: 1, userName: "User1", msg: "Great event experience!" },
    { id: 2, userName: "User2", msg: "Highly recommended to attend!" },
  ];

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#f9fafb', 
      fontFamily: 'sans-serif',
      overflowY: 'auto',
      boxSizing: 'border-box',
      paddingBottom: '60px'
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
            Unknown User
          </h1>
          <p style={{ 
            margin: '0.25rem 0 0.5rem 0', 
            fontSize: '0.875rem', 
            color: '#6b7280' 
          }}>
            no-email@example.com
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
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>0</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>upcoming events</div>
        </div>
        
        <div style={{ flex: 1, minWidth: '80px' }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>0</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>past events</div>
        </div>
        
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

      {/* Reviews Section */}
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

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#111827'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#111827'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#111827'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#111827'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
    </div>
  );
}