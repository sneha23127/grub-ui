import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { requestUserLocation } from '../utils/location';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      alert("Please fill out all fields.");
      return;
    }

    // Clear any existing session before attempting a new login
    sessionStorage.removeItem('user');

    try {
      console.log(`Attempting login for: ${formData.identifier}`);
      const response = await axios.post('http://localhost:5000/api/login', {
        identifier: formData.identifier,
        password: formData.password
      });

      if (response.data.status === 'success') {
        const user = response.data.user;
        alert(`Login successful! Welcome ${user.name}`);
        
        // Persist user info
        sessionStorage.setItem('user', JSON.stringify(user));

        // Request location permission for student users
        if (user.role === 'student') {
          setShowLocationModal(true);
        } else {
          // Redirect based on role
          if (user.role === 'admin') {
            navigate('/admin');
          } else if (user.role === 'mess_owner') {
            navigate('/owner');
          } else {
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        alert(error.response.data.message || "Invalid credentials. Please try again.");
      } else if (error.request) {
        // The request was made but no response was received
        alert("Unable to connect to the server. Please ensure the backend is running.");
      } else {
        // Something else happened
        alert("An error occurred during login. Please try again.");
      }
    }
  };

  const handleAllowLocation = async () => {
    setIsRequestingLocation(true);
    try {
      await requestUserLocation();
    } catch (err) {
      console.warn("Location permission flow failed:", err);
    } finally {
      setIsRequestingLocation(false);
      setShowLocationModal(false);
      navigate('/');
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    navigate('/');
  };

  const renderLocationModal = () => {
    if (!showLocationModal) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '24px'
      }}>
        <div style={{
          background: 'white',
          maxWidth: '440px',
          width: '100%',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>📍</div>
          <h3 style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#1A1A1A',
            marginBottom: '12px'
          }}>Allow Location Access</h3>
          <p style={{
            fontSize: '14px',
            color: '#555',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            GrubSpot needs your location permission to show you nearby messes and calculate exact walking/travel distances for your meals.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button
              onClick={handleAllowLocation}
              disabled={isRequestingLocation}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                background: '#F26B2E',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isRequestingLocation ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Requesting permission...
                </>
              ) : (
                'Yes, Allow Location'
              )}
            </button>
            <button
              onClick={handleSkipLocation}
              disabled={isRequestingLocation}
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #E2E8F0',
                background: 'transparent',
                color: '#64748B',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="split-screen">
      {/* Left Pane (Image & Text) */}
      <div className="left-pane">
        <div className="brand">
          <div className="logo-icon">GS</div>
          <div className="brand-name">GrubSpot</div>
        </div>
        <h1 className="left-title">Discover trusted home-style mess services near you</h1>
        <p className="left-subtitle">20+ messes · 2000+ students · Bengaluru</p>
      </div>

      {/* Right Pane (Form) */}
      <div className="right-pane">
        <div className="form-container">
          <div className="get-started">WELCOME BACK!</div>
          <h2 className="form-title">Login</h2>
          <div style={{ marginBottom: "32px" }}></div> {/* Spacer to match design proportions */}

          <form onSubmit={handleLogin}>
            {/* Email Address */}
            <div className="input-group">
              <label className="input-label">Email or Username</label>
              <input 
                type="text" 
                name="identifier" 
                value={formData.identifier} 
                onChange={handleChange} 
                className="input-field" 
                placeholder="email or username" 
              />
            </div>

            {/* Password */}
            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label className="input-label">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field" 
                  placeholder="••••••••" 
                />
                <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    {showPassword && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />}
                  </svg>
                </div>
              </div>
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--text-light)', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" >
              Login
            </button>
            
            {/* Footer Text */}
            <div className="footer-text">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
      {renderLocationModal()}
    </div>
  );
}

export default Login;
