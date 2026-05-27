import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { getUserCoords, getDistanceToMess, getDistanceFromCoords, parseDistance, requestUserLocation } from '../utils/location';

function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [savedMesses, setSavedMesses] = useState([]);
  const [messes, setMesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedMesses') || '[]');
    setSavedMesses(saved);
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
          const details = m.details || {};
          const specials = dbMenu ? [
            ...(dbMenu.breakfast || []).slice(0, 1).map(i => i.name),
            ...(dbMenu.lunch || []).slice(0, 1).map(i => i.name)
          ].filter(Boolean) : [];
          const totalPrice = details.subscriptionPlans?.oneMonth || 0;
          return {
            id: m.id,
            name: m.mess_name || "New Mess",
            owner: m.name,
            rating: Number(m.avg_rating).toFixed(1) || details.avgRating || "0.0",
            reviews: m.total_reviews || details.totalReviews || 0,
            distance: 'Calculating...',
            type: details.type || 'Standard',
            tag: details.tag || 'GENERAL',
            categories: specials.length > 0 ? specials : ['Menu not set'],
            price: totalPrice > 0 ? '₹' + totalPrice.toLocaleString('en-IN') : null,
            address: m.address || "Location not set",
            latitude: m.latitude,
            longitude: m.longitude,
            image: details.image || null
          };
        });
        setMesses(mapped);

        // Compute distances — use stored lat/lng directly if available (instant),
        // otherwise fall back to Nominatim geocoding of the address string.
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

  useEffect(() => {
    // Re-calculate distances if user location becomes available after load
  }, []);

  const toggleSaveMess = (id, e) => {
    e.stopPropagation();
    let updated;
    if (savedMesses.includes(id)) {
      updated = savedMesses.filter(mId => mId !== id);
    } else {
      updated = [...savedMesses, id];
    }
    setSavedMesses(updated);
    localStorage.setItem('savedMesses', JSON.stringify(updated));
  };

  const filters = ['All', 'South Indian', 'North Indian', 'Veg', 'Non-Veg', 'Veg & Non-Veg'];

  const filteredMesses = messes.filter(mess => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Veg') return mess.tag?.toLowerCase() === 'veg';
    if (activeFilter === 'Non-Veg') return mess.tag?.toLowerCase() === 'non-veg';
    if (activeFilter === 'Veg & Non-Veg') return mess.tag?.toLowerCase().includes('non-veg') && mess.tag?.toLowerCase().includes('veg');
    if (activeFilter === 'South Indian' || activeFilter === 'North Indian') return mess.type === activeFilter;
    return true;
  });

  // Use top 6 filtered messes for Home page
  const messesToDisplay = filteredMesses.slice(0, 6);

  return (
    <div className="home-page" style={{ overflowX: 'hidden' }}>
      <NavBar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">Find Your Perfect Mess</div>
        <h1 className="hero-title">
          Discover Messes <span style={{ color: 'var(--orange)' }}>Near You</span>
        </h1>
        <p className="hero-subtitle">
          Find affordable, hygienic home-style mess services across Bengaluru.
          Compare messes, subscribe to plans, and eat well every day.
        </p>
        <div className="search-box">
          <input type="text" className="search-input" placeholder="Search by name, area or cuisine..." />
          <button className="search-btn">Search</button>
        </div>
      </section>

      {/* Stats Section */}
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{messes.length || 0}</span>
            <span className="stat-label">Messes Listed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{messes.reduce((acc, m) => acc + (parseInt(m.reviews) || 0), 0)}+</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              ★ {messes.reduce((acc, m) => acc + (parseInt(m.reviews) || 0), 0) > 0 
                ? (messes.reduce((acc, m) => acc + (parseFloat(m.rating) || 0) * (parseInt(m.reviews) || 0), 0) / 
                   messes.reduce((acc, m) => acc + (parseInt(m.reviews) || 0), 0)).toFixed(1)
                : "0.0"}
            </span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      {/* Mess Listings */}
      <section id="messes" className="section-padding container">
        <div className="filter-tabs">
          {filters.map(filter => (
            <button 
              key={filter} 
              className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 className="mess-name" style={{ fontSize: '24px' }}>Top Rated Messes Nearby</h2>
          <a href="#all" onClick={() => navigate('/messes')} style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View all →</a>
        </div>

        <div className="mess-grid">
          {messesToDisplay.map(mess => (
            <div key={mess.id} className="mess-card">
              <div 
                className="mess-image-placeholder"
                style={{
                  backgroundImage: mess.image ? `url(${mess.image})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}
              >
                <div className={`mess-tag ${mess.tag && mess.tag.toLowerCase() === 'veg' ? 'veg' : (mess.tag && mess.tag.toLowerCase().includes('non-veg') ? 'non-veg' : '')}`}>
                  {mess.tag}
                </div>
                <div 
                  onClick={(e) => toggleSaveMess(mess.id, e)}
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
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: '0.2s transform'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" 
                    fill={savedMesses.includes(mess.id) ? "var(--orange)" : "none"} 
                    stroke={savedMesses.includes(mess.id) ? "var(--orange)" : "#4A4A4A"} 
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </div>
              </div>
              <div className="mess-content">
                <h3 className="mess-name">{mess.name}</h3>
                <div className="mess-info">
                  <span>★ {mess.rating} ({mess.reviews})</span>
                  <span>•</span>
                  <span>📍 {mess.distance}</span>
                  <span>•</span>
                  <span>{mess.type}</span>
                </div>

                <div className="mess-footer">
                  <div className="mess-price">
                    {mess.price && <><span style={{ color: 'var(--orange)', fontSize: '18px', fontWeight: 'bold' }}>{mess.price}</span>/month</>}
                  </div>
                  <button className="subscribe-btn" onClick={() => navigate(`/mess/${mess.id}`)}>Subscribe</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="section-padding process-section container">
        <h2 className="form-title" style={{ marginBottom: '48px', textAlign: 'center' }}>How GrubSpot Works</h2>
        <div className="process-grid">
          <div className="process-step">
            <div className="step-icon">🔍</div>
            <h3 className="mess-name">Search & Filter</h3>
            <p className="footer-text">Find messes by location, cuisine type, or dietary preference.</p>
          </div>
          <div className="process-step">
            <div className="step-icon">⚖️</div>
            <h3 className="mess-name">Compare Messes</h3>
            <p className="footer-text">View menus, pricing, ratings, and read reviews side by side.</p>
          </div>
          <div className="process-step">
            <div className="step-icon">🍱</div>
            <h3 className="mess-name">Subscribe & Eat</h3>
            <p className="footer-text">Choose a subscription plan and enjoy tasty home-cooked meals.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to find your perfect mess?</h2>
          <p style={{ opacity: 0.9 }}>Browse all 20+ verified mess services in Bengaluru.</p>
          <button onClick={() => navigate('/messes')} className="cta-btn" style={{ border: 'none', cursor: 'pointer' }}>Browse All Messes</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
