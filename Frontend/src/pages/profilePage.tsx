import { useState } from "react";

export default function ProfilePage() {
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