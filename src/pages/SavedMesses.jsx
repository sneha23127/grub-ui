import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { getUserCoords, getDistanceToMess, getDistanceFromCoords, parseDistance, requestUserLocation } from '../utils/location';

function SavedMesses() {
  const [savedIds, setSavedIds] = useState([]);
  const [messes, setMesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    window.scrollTo(0, 0);
    // Read from DB-synced user object
    if (user && user.details && user.details.savedMesses) {
      setSavedIds(user.details.savedMesses);
    } else {
      const saved = JSON.parse(localStorage.getItem('savedMesses') || '[]');
      setSavedIds(saved);
    }
    // Request location first so it's ready when fetchMesses runs
    const init = async () => {
      await requestUserLocation();
      fetchMesses();
    };
    init();
  }, []);

  const fetchMesses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/messes');
      if (res.data.status === 'success') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = days[new Date().getDay()];

        const mapped = res.data.messes.map(m => {
          const dbMenu = m.menu_data ? m.menu_data[today] : null;
          const specials = dbMenu ? [
            ...(dbMenu.breakfast || []).slice(0, 1).map(i => i.name),
            ...(dbMenu.lunch || []).slice(0, 1).map(i => i.name)
          ].filter(Boolean) : [];

          const details = m.details || {};
          return {
            id: m.id,
            name: m.mess_name || "New Mess",
            owner: m.name,
            rating: details.avgRating || "0.0",
            reviews: details.totalReviews || 0,
            distance: "Calculating...",
            type: details.type || 'Standard',
            tag: details.tag || 'GENERAL',
            categories: specials.length > 0 ? specials : ['Menu not set'],
            price: details.subscriptionPlans?.oneMonth ? '₹' + details.subscriptionPlans.oneMonth.toLocaleString('en-IN') : 'Price Not Set',
            address: m.address || "Location not set",
            latitude: m.latitude,
            longitude: m.longitude,
            image: details.image || null
          };
        });
        setMesses(mapped);

        // Compute distances in background
        const userCoords = getUserCoords();
        if (userCoords) {
          const withDistances = await Promise.all(
            mapped.map(async (m) => {
              const direct = getDistanceFromCoords(userCoords, m.latitude, m.longitude);
              const distance = direct !== null ? direct : await getDistanceToMess(userCoords, m.address);
              return { ...m, distance };
            })
          );
          withDistances.sort((a, b) => parseDistance(a.distance) - parseDistance(b.distance));
          setMesses(withDistances);
        } else {
          setMesses(mapped.map(m => ({ ...m, distance: 'Not calculated' })));
        }
      }
    } catch (error) {
      console.error('Error fetching messes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savedMesses = messes.filter(m => savedIds.includes(m.id));

  const toggleSaveMess = async (id, e) => {
    e.stopPropagation();
    const updated = savedIds.filter(mId => mId !== id);
    setSavedIds(updated);
    localStorage.setItem('savedMesses', JSON.stringify(updated));

    if (user) {
      try {
        const res = await axios.post('http://localhost:5000/api/users/update-profile', {
          id: user.id,
          details: { ...user.details, savedMesses: updated }
        });
        if (res.data.status === 'success') {
          sessionStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (error) {
        console.error('Error saving wishlist to DB:', error);
      }
    }
  };

  return (
    <div className="saved-messes-page" style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      
      <main className="container section-padding" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ color: '#F26B2E' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A1A' }}>Saved Messes</h1>
        </div>
        <p style={{ color: '#7E7E7E', fontSize: '15px', marginBottom: '48px', marginLeft: '44px' }}>
          {savedMesses.length} messes saved
        </p>

        {savedMesses.length > 0 ? (
          <div className="mess-grid">
            {savedMesses.map(mess => (
              <div key={mess.id} className="mess-card">
                <div 
                  className="mess-image-placeholder" 
                  style={{ 
                    position: 'relative',
                    backgroundImage: mess.image ? `url(${mess.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className={`mess-tag ${mess.tag && mess.tag.toLowerCase() === 'veg' ? 'veg' : (mess.tag && mess.tag.toLowerCase().includes('non-veg') ? 'non-veg' : '')}`} style={{ zIndex: 1 }}>
                    {mess.tag}
                  </div>
                  <div 
                    onClick={(e) => toggleSaveMess(mess.id, e)}
                    className="flex-center"
                    style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: 'white', 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      cursor: 'pointer', 
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                      zIndex: 1
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F26B2E" stroke="#F26B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="mess-content">
                  <h3 className="mess-name">{mess.name}</h3>
                  <div className="mess-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ color: '#F26B2E', fontWeight: '700' }}>★ {mess.rating}</span>
                    <span style={{ color: '#7E7E7E' }}>({mess.reviews})</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#7E7E7E', fontSize: '13px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {mess.distance} from you
                  </div>
  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#7E7E7E', fontSize: '13px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                    {mess.type}
                  </div>
  

  
                  <div className="mess-footer" style={{ borderTop: '1px solid #EEE', paddingTop: '16px' }}>
                    <div className="mess-price">
                      <span style={{ color: '#1A1A1A', fontWeight: '800', fontSize: '16px' }}>{mess.price}</span>/month
                    </div>
                    <button className="subscribe-btn" style={{ background: '#F26B2E', width: '100%', borderRadius: '12px', marginTop: '12px' }} onClick={() => navigate(`/mess/${mess.id}`)}>
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#7E7E7E' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔖</div>
            <h3>No saved messes yet.</h3>
            <p>Start exploring and save messes you like!</p>
            <button className="cta-btn" onClick={() => navigate('/messes')} style={{ marginTop: '24px' }}>Explore Messes</button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default SavedMesses;
