import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { getUserCoords, getDistanceToMess, getDistanceFromCoords, parseDistance, requestUserLocation } from '../utils/location';

function MessList() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedMesses, setSavedMesses] = useState([]);
  const [messes, setMesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  useEffect(() => {
    // Read from DB-synced user object in localStorage
    if (user && user.details && user.details.savedMesses) {
      setSavedMesses(user.details.savedMesses);
    } else {
      const saved = JSON.parse(localStorage.getItem('savedMesses') || '[]');
      setSavedMesses(saved);
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
            distance: "Calculating...",
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

  const toggleSaveMess = async (id, e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to save messes!");
      navigate('/login');
      return;
    }

    let updated;
    if (savedMesses.includes(id)) {
      updated = savedMesses.filter(mId => mId !== id);
    } else {
      updated = [...savedMesses, id];
    }
    
    setSavedMesses(updated);
    localStorage.setItem('savedMesses', JSON.stringify(updated));

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
  };

  const filters = ['All', 'South Indian', 'North Indian', 'Veg', 'Non-Veg', 'Veg & Non-Veg'];

  // Filtering Logic
  const filteredMesses = messes.filter(mess => {
    const matchesFilter = activeFilter === 'All' || 
                         mess.tag === activeFilter || 
                         mess.type === activeFilter;
    
    const matchesSearch = mess.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mess.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mess-list-page" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <NavBar />

      <main className="container section-padding">
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              List of <span style={{ color: '#F26B2E' }}>Messes</span>
            </h1>
            <p style={{ color: '#7E7E7E', fontSize: '14px' }}>
              {filteredMesses.length} messes found in Bengaluru
            </p>
          </div>

          <div className="search-box" style={{ maxWidth: '400px', margin: 0 }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search messes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-tabs" style={{ justifyContent: 'flex-start', marginBottom: '48px' }}>
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

        {/* Mess Grid */}
        <div className="mess-grid">
          {filteredMesses.map(mess => (
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
                    fill={savedMesses.includes(mess.id) ? "#F26B2E" : "none"} 
                    stroke={savedMesses.includes(mess.id) ? "#F26B2E" : "#4A4A4A"} 
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </div>
              </div>
              <div className="mess-content">
                <h3 className="mess-name">{mess.name}</h3>
                <div className="mess-info">
                  <span style={{ color: '#FF9800' }}>★ {mess.rating}</span>
                  <span>({mess.reviews})</span>
                  <span>•</span>
                  <span>📍 {mess.distance}</span>
                  <span>•</span>
                  <span>🍴 {mess.type}</span>
                </div>

                <div className="mess-footer">
                  <div className="mess-price">
                    {mess.price && <><span style={{ color: '#F26B2E', fontSize: '18px', fontWeight: 'bold' }}>{mess.price}</span>/month</>}
                  </div>
                  <button className="subscribe-btn" onClick={() => navigate(`/mess/${mess.id}`)}>Subscribe</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMesses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#7E7E7E' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🍽️</div>
            <h3>No messes found matching your search.</h3>
            <p>Try different keywords or filters.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MessList;
