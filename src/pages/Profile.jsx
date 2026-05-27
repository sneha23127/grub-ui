import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

function Profile() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    const userData = savedUser ? JSON.parse(savedUser) : null;
    
    return {
      name: userData?.name || 'Guest User',
      email: userData?.email || 'Not logged in',
      phone: userData?.phone || '+91 00000 00000',
      location: userData?.address || 'Location not set',
      role: userData?.role || 'Student',
      joined: userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently'
    };
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getInitials = (name) => {
    if (!name || name === 'Guest User') return 'GS';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    
    // In a real app, this would be an API call to the backend
    try {
      const currentSession = JSON.parse(sessionStorage.getItem('user') || '{}');
      const updatedUser = { ...currentSession, ...user, role: currentSession.role }; // Preserve role from session
      
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <div className="profile-page" style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      
      {/* Banner Section */}
      <div className="profile-banner">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="profile-avatar-large">
              {getInitials(user.name)}
              <div className="verified-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: '28px', color: '#1A1A1A', fontWeight: '700', marginBottom: '4px' }}>{user.name}</h1>
              <div style={{ fontSize: '13px', color: '#F26B2E', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{user.role}</div>
              <div style={{ display: 'flex', gap: '16px', color: '#7E7E7E', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F26B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {user.location.split(',')[0]}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F26B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Joined {user.joined}
                </span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            {isEditing ? (
              <button className="btn-outline" onClick={handleSaveProfile}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save Profile
              </button>
            ) : (
              <button className="btn-outline" onClick={() => setIsEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Edit Profile
              </button>
            )}
            <button className="btn-outline-danger" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="container" style={{ flex: 1, padding: '24px 0', paddingBottom: '40px' }}>
        <div className="profile-grid">
          
          {/* Left Column: Personal Information */}
          <div className="profile-card">
            <h2 className="card-title">Personal Information</h2>
            
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="info-content" style={{ width: '100%', maxWidth: '300px' }}>
                  <div className="info-label">FULL NAME</div>
                  {isEditing ? (
                    <input type="text" value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '14px' }} />
                  ) : (
                    <div className="info-value">{user.name}</div>
                  )}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className="info-content">
                  <div className="info-label">EMAIL</div>
                  <div className="info-value">
                    {user.email}
                    <span className="verified-pill">Verified</span>
                  </div>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className="info-content" style={{ width: '100%', maxWidth: '300px' }}>
                  <div className="info-label">PHONE NUMBER</div>
                  {isEditing ? (
                    <input type="text" value={user.phone} onChange={(e) => setUser({...user, phone: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '14px' }} />
                  ) : (
                    <div className="info-value">{user.phone}</div>
                  )}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className="info-content" style={{ width: '100%', maxWidth: '300px' }}>
                  <div className="info-label">LOCATION</div>
                  {isEditing ? (
                    <input type="text" value={user.location} onChange={(e) => setUser({...user, location: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '14px' }} />
                  ) : (
                    <div className="info-value">{user.location}</div>
                  )}
                </div>
              </div>
            </div>
          </div>


        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;
