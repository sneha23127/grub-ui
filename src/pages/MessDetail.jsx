import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { getUserCoords, getDistanceToMess, getDistanceFromCoords, requestUserLocation } from '../utils/location';

function MessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mess, setMess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for interactive layout
  const [activeTab, setActiveTab] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]);
  const [selectedMeals, setSelectedMeals] = useState({ 
    breakfast: { selected: true, type: 'Veg' }, 
    lunch: { selected: true, type: 'Veg' }, 
    dinner: { selected: false, type: 'Veg' } 
  });
  const [duration, setDuration] = useState('1 Month');
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const getUser = () => {
    try {
      const u = sessionStorage.getItem('user');
      if (u && u !== 'undefined') return JSON.parse(u);
    } catch (e) {
      console.error("Error parsing user from sessionStorage", e);
    }
    return null;
  };
  const user = getUser();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    window.scrollTo(0, 0);
    // Request location first so it's available for distance calculation
    const init = async () => {
      await requestUserLocation();
      fetchMessDetail();
    };
    init();
    fetchReviews();
    fetchUserSubscriptions();
    const saved = JSON.parse(localStorage.getItem('savedMesses') || '[]');
    setIsSaved(saved.includes(parseInt(id)));
  }, [id, activeTab]);

  const fetchUserSubscriptions = async () => {
    if (!user || !user.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/subscriptions/user/${user.id}`);
      if (res.data.status === 'success') {
        setUserSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/messes');
      if (res.data.status === 'success') {
        const found = res.data.messes.find(m => m.id === parseInt(id));
        if (found) {
          const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/mess/${encodeURIComponent(found.mess_name)}`);
          if (reviewsRes.data.status === 'success') {
            setReviewsList(reviewsRes.data.reviews);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchMessDetail = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/messes');
      if (res.data.status === 'success') {
        const found = res.data.messes.find(m => m.id === parseInt(id));
        if (found) {
          const dbMenuFull = found.menu_data || {};
          const dbMenuForDay = dbMenuFull[activeTab] || null;
          const details = found.details || {};
          
          const messData = {
            id: found.id,
            name: found.mess_name || "Untitled Mess",
            owner: found.name || "Owner",
            rating: details.avgRating || "0.0",
            reviews: details.totalReviews || 0,
            distance: "Calculating...",
            type: details.type || 'Standard',
            tag: details.tag || 'GENERAL',
            price: details.subscriptionPlans?.oneMonth ? '₹' + details.subscriptionPlans.oneMonth.toLocaleString('en-IN') : 'Price Not Set',
            fullAddress: found.address || "Address not provided",
            phone: found.phone || "No contact",
            pricing: details.pricing || { breakfast: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 },
            homeDelivery: details.homeDelivery || false,
            deliveryCharge: details.deliveryCharge || 0,
            subscriptionPlans: details.subscriptionPlans || { trial: 0, oneMonth: 0, threeMonth: 0 },
            paymentOptions: details.paymentOptions || { upi: true, cash: true },
            image: details.image || null,
            googleMapUrl: details.googleMapUrl || '',
            menu: {
              breakfast: { 
                time: details.timings?.breakfast || "00:00 AM - 00:00 AM", 
                items: dbMenuForDay?.breakfast?.length > 0 ? dbMenuForDay.breakfast.map(i => i.name + (i.status === 'Unavailable' ? ' (Unavailable)' : '')) : ["Menu not updated"] 
              },
              lunch: { 
                time: details.timings?.lunch || "00:00 PM - 00:00 PM", 
                items: dbMenuForDay?.lunch?.length > 0 ? dbMenuForDay.lunch.map(i => i.name + (i.status === 'Unavailable' ? ' (Unavailable)' : '')) : ["Menu not updated"] 
              },
              dinner: { 
                time: details.timings?.dinner || "00:00 PM - 00:00 PM", 
                items: dbMenuForDay?.dinner?.length > 0 ? dbMenuForDay.dinner.map(i => i.name + (i.status === 'Unavailable' ? ' (Unavailable)' : '')) : ["Menu not updated"] 
              }
            }
          };
          setMess(messData);

          // Compute real distance
          const userCoords = getUserCoords();
          if (userCoords) {
            const direct = getDistanceFromCoords(userCoords, found.latitude, found.longitude);
            const dist = direct !== null ? direct : await getDistanceToMess(userCoords, found.address);
            setMess(prev => ({ ...prev, distance: dist }));
          } else {
            setMess(prev => ({ ...prev, distance: 'Not calculated' }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching mess detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mess && mess.tag) {
      const tag = mess.tag.toUpperCase();
      let defaultType = 'Veg';
      if (tag === 'NON-VEG') defaultType = 'NonVeg';
      
      setSelectedMeals(prev => ({
        ...prev,
        breakfast: { ...prev.breakfast, type: defaultType },
        lunch: { ...prev.lunch, type: defaultType },
        dinner: { ...prev.dinner, type: defaultType }
      }));
    }
  }, [mess?.id, mess?.tag]);

  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem('savedMesses') || '[]');
    let updated;
    if (saved.includes(parseInt(id))) {
      updated = saved.filter(mId => mId !== parseInt(id));
      setIsSaved(false);
    } else {
      updated = [...saved, parseInt(id)];
      setIsSaved(true);
    }
    localStorage.setItem('savedMesses', JSON.stringify(updated));
  };

  if (!mess) {
    return (
      <div className="home-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h2>Mess Not Found</h2>
          <button className="cta-btn" onClick={() => navigate('/messes')}>Back to List</button>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate pricing
  const toggleMeal = (mealType) => {
    setSelectedMeals(prev => ({ ...prev, [mealType]: { ...prev[mealType], selected: !prev[mealType].selected } }));
  };

  const changeMealType = (meal, type) => {
    setSelectedMeals(prev => ({ ...prev, [meal]: { ...prev[meal], type } }));
  };

  const getDailyCost = () => {
    let cost = 0;
    if (selectedMeals.breakfast.selected) {
      if (mess.tag === 'Veg & Non-Veg') {
        cost += (mess.pricing[`breakfast${selectedMeals.breakfast.type}`] || 0);
      } else {
        cost += (mess.pricing.breakfast || 0);
      }
    }
    if (selectedMeals.lunch.selected) cost += (mess.pricing[`lunch${selectedMeals.lunch.type}`] || 0);
    if (selectedMeals.dinner.selected) cost += (mess.pricing[`dinner${selectedMeals.dinner.type}`] || 0);
    return cost;
  };

  const calculateTotal = () => {
    let base = 0;
    const dailyCost = getDailyCost();
    
    if (duration === 'Trial (15 Days)') base = dailyCost * 15;
    else if (duration === '1 Month') base = dailyCost * 30;
    else if (duration === '3 Months') base = dailyCost * 90;
    
    if (homeDelivery) {
       base += (mess.deliveryCharge || 0);
    }
    return base;
  };

  const handleSubscribe = () => {
    if (user) {
      // Check for active or paused subscriptions
      const hasActiveSub = userSubscriptions.some(s => 
        s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'paused'
      );

      if (hasActiveSub) {
        alert('You already have an active or paused subscription. You can only subscribe to a new mess once your current subscription expires.');
        return;
      }

      navigate('/payment', { 
        state: { 
          messName: mess.name, 
          messId: mess.id,
          totalAmount: calculateTotal(),
          selectedPlan: duration,
          selectedMeals: selectedMeals,
          homeDelivery: homeDelivery,
          paymentOptions: mess.paymentOptions || { upi: true, cash: true }
        } 
      });
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="home-page" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <NavBar />
      
      <main className="container" style={{ paddingBottom: '80px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ padding: '24px 0', fontSize: '13px', color: '#7E7E7E' }}>
          <Link to="/" style={{ color: '#F26B2E', textDecoration: 'none' }}>Home</Link> / 
          <Link to="/messes" style={{ color: '#F26B2E', textDecoration: 'none', marginLeft: '6px' }}>Messes</Link> / 
          <span style={{ color: '#1A1A1A', marginLeft: '6px', fontWeight: '500' }}>{mess.name}</span>
        </div>

        {/* Hero Banner with Integrated Text */}
        <div className="detail-banner" style={{ background: mess.image ? `url(${mess.image}) center/cover no-repeat` : 'url(https://via.placeholder.com/1200x400?text=+) center/cover no-repeat #E8E8E8', position: 'relative' }}>
          <div className="banner-overlay">
            <span className={`mess-tag ${mess.tag && mess.tag.toLowerCase() === 'veg' ? 'veg' : (mess.tag && mess.tag.toLowerCase().includes('non-veg') ? 'non-veg' : '')}`} style={{ position: 'relative', top: 0, left: 0, display: 'inline-block', marginBottom: '12px' }}>
              {mess.tag}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 className="banner-title">{mess.name}</h1>
              <div 
                onClick={toggleSave}
                style={{ 
                  background: 'white', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: '0.2s transform'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" 
                  fill={isSaved ? "var(--orange)" : "none"} 
                  stroke={isSaved ? "var(--orange)" : "#4A4A4A"} 
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                </svg>
              </div>
            </div>
            <div className="banner-meta">
              <span>📍 {mess.distance}</span>
              <span>🍴 {mess.type}</span>
              <span style={{ color: '#FF9800', fontWeight: 'bold' }}>
                ★ {reviewsList.length > 0 
                    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1) 
                    : mess.rating} 
                <span style={{ color: '#FFF', fontWeight: 'normal' }}>({reviewsList.length} reviews)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 70/30 Grid Layout */}
        <div className="mess-detail-grid">
          
          {/* LEFT 70% */}
          <div className="left-content">
            
            {/* Tabs */}
            <div className="day-tabs">
              {days.map(day => (
                <button 
                  key={day} 
                  className={`day-tab ${activeTab === day ? 'active' : ''}`}
                  onClick={() => setActiveTab(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
               {activeTab === 'Mon' ? "Monday's Menu" : `${activeTab}day's Menu`}
            </h2>

            {/* Menu Cards */}
            <div className="menu-schedule">
              {/* Breakfast */}
              <div className="menu-section-card">
                <div className="menu-card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Breakfast</h3>
                  <span className="menu-time">⏱ {mess.menu.breakfast.time}</span>
                </div>
                <ul className="menu-items-list">
                  {mess.menu.breakfast.items.map((item, id) => <li key={id}>{item}</li>)}
                </ul>
              </div>

              {/* Lunch */}
              <div className="menu-section-card">
                <div className="menu-card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Lunch</h3>
                  <span className="menu-time">⏱ {mess.menu.lunch.time}</span>
                </div>
                <ul className="menu-items-list">
                  {mess.menu.lunch.items.map((item, id) => <li key={id}>{item}</li>)}
                </ul>
              </div>

              {/* Dinner */}
              <div className="menu-section-card">
                <div className="menu-card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Dinner</h3>
                  <span className="menu-time">⏱ {mess.menu.dinner.time}</span>
                </div>
                <ul className="menu-items-list">
                  {mess.menu.dinner.items.map((item, id) => <li key={id}>{item}</li>)}
                </ul>
              </div>
            </div>

            {/* Info Widgets Row */}
            <div className="info-cards-row">
              <div className="info-widget">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Location & Contact</h3>
                <div style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <span>📍</span> <span>{mess.fullAddress}</span>
                </div>
                <div style={{ color: '#7E7E7E', fontSize: '14px', display: 'flex', gap: '8px' }}>
                  <span>📞</span> <span>{mess.phone}</span>
                </div>
              </div>

              <div className="info-widget">
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Payment & Delivery</h3>
                {mess.homeDelivery ? (
                  <div style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '12px', display: 'flex', gap: '8px', fontWeight: '500' }}>
                    <span>✓</span> <span>Home Delivery Available</span>
                  </div>
                ) : (
                  <div style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '12px', display: 'flex', gap: '8px', fontWeight: '500' }}>
                    <span>🍽️</span> <span>Dine-in Only (No Delivery)</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {mess.paymentOptions?.upi !== false && (
                    <span style={{ padding: '4px 12px', background: '#FFF0E6', color: '#F26B2E', fontSize: '12px', borderRadius: '4px', fontWeight: '600' }}>UPI</span>
                  )}
                  {mess.paymentOptions?.cash !== false && (
                    <span style={{ padding: '4px 12px', background: '#FFF0E6', color: '#F26B2E', fontSize: '12px', borderRadius: '4px', fontWeight: '600' }}>Cash</span>
                  )}
                  {mess.paymentOptions?.upi === false && mess.paymentOptions?.cash === false && (
                    <span style={{ color: '#7E7E7E', fontSize: '13px' }}>No payment methods set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Student Reviews Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Student Reviews</h2>
            </div>
            
            {reviewsList.length === 0 ? (
              <div className="info-widget" style={{ background: '#F9FAFB', border: '1px dashed #E5E7EB', padding: '40px 24px', textAlign: 'center', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>No Reviews Yet</h3>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Be the first to leave a review after subscribing to this mess!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviewsList.map(review => (
                  <div key={review.id} className="info-widget" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                          {review.user_name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1A1A1A' }}>{review.user_name}</div>
                          <div style={{ fontSize: '12px', color: '#7E7E7E' }}>{new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div style={{ color: '#FFD700', fontSize: '14px' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p style={{ color: '#4A4A4A', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 30% STICKY SUB CARD */}
          <div>
            <div className="subscription-sticky-card">
              <h2 className="sidebar-title">Subscription Plan</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: '600', marginBottom: '12px' }}>Step 1: Select Meal (Up to 3)</h3>
                
                <div className={`box-selector ${selectedMeals.breakfast.selected ? 'active' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedMeals.breakfast.selected} onChange={() => toggleMeal('breakfast')} /> Breakfast
                    </label>
                    <span style={{ color: '#F26B2E', fontSize: '12px', background: '#FFF0E6', padding: '2px 8px', borderRadius: '12px' }}>₹{mess.tag === 'Veg & Non-Veg' ? (mess.pricing[`breakfast${selectedMeals.breakfast.type}`] || 0) : (mess.pricing.breakfast || 0)}/day</span>
                  </div>
                  {selectedMeals.breakfast.selected && (mess.tag.toUpperCase() === 'VEG & NON-VEG') && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingLeft: '24px' }}>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.breakfast.type === 'Veg'} onChange={() => changeMealType('breakfast', 'Veg')} /> Veg
                      </label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.breakfast.type === 'NonVeg'} onChange={() => changeMealType('breakfast', 'NonVeg')} /> Non-Veg
                      </label>
                    </div>
                  )}
                </div>

                <div className={`box-selector ${selectedMeals.lunch.selected ? 'active' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedMeals.lunch.selected} onChange={() => toggleMeal('lunch')} /> Lunch
                    </label>
                    <span style={{ color: '#F26B2E', fontSize: '12px', background: '#FFF0E6', padding: '2px 8px', borderRadius: '12px' }}>₹{mess.pricing[`lunch${selectedMeals.lunch.type}`] || 0}/day</span>
                  </div>
                  {selectedMeals.lunch.selected && (mess.tag.toUpperCase() === 'VEG & NON-VEG') && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingLeft: '24px' }}>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.lunch.type === 'Veg'} onChange={() => changeMealType('lunch', 'Veg')} /> Veg
                      </label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.lunch.type === 'NonVeg'} onChange={() => changeMealType('lunch', 'NonVeg')} /> Non-Veg
                      </label>
                    </div>
                  )}

                </div>

                <div className={`box-selector ${selectedMeals.dinner.selected ? 'active' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedMeals.dinner.selected} onChange={() => toggleMeal('dinner')} /> Dinner
                    </label>
                    <span style={{ color: '#F26B2E', fontSize: '12px', background: '#FFF0E6', padding: '2px 8px', borderRadius: '12px' }}>₹{mess.pricing[`dinner${selectedMeals.dinner.type}`] || 0}/day</span>
                  </div>
                  {selectedMeals.dinner.selected && (mess.tag.toUpperCase() === 'VEG & NON-VEG') && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingLeft: '24px' }}>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.dinner.type === 'Veg'} onChange={() => changeMealType('dinner', 'Veg')} /> Veg
                      </label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" checked={selectedMeals.dinner.type === 'NonVeg'} onChange={() => changeMealType('dinner', 'NonVeg')} /> Non-Veg
                      </label>
                    </div>
                  )}

                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: '600', marginBottom: '12px' }}>Step 2: Select Duration</h3>
                <div className="duration-selector">
                  <div className={`duration-pill ${duration === 'Trial (15 Days)' ? 'active' : ''}`} onClick={() => setDuration('Trial (15 Days)')}>
                    Trial (15 Days)
                    <span>₹{getDailyCost() * 15}</span>
                  </div>
                  <div className={`duration-pill ${duration === '1 Month' ? 'active' : ''}`} onClick={() => setDuration('1 Month')}>
                    1 Month
                    <span>₹{getDailyCost() * 30}</span>
                  </div>
                  <div className={`duration-pill ${duration === '3 Months' ? 'active' : ''}`} onClick={() => setDuration('3 Months')}>
                    3 Months
                    <span>₹{getDailyCost() * 90}</span>
                  </div>
                </div>
              </div>

              {mess.homeDelivery && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: '600', marginBottom: '12px' }}>Step 3: Add-ons</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#1A1A1A', padding: '8px 0', cursor: 'pointer' }} onClick={() => setHomeDelivery(!homeDelivery)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                       <input type="checkbox" checked={homeDelivery} readOnly style={{ marginRight: '12px', accentColor: 'var(--orange)' }} />
                       Home Delivery
                    </div>
                    <span style={{ color: '#F26B2E', fontSize: '13px' }}>+₹{mess.deliveryCharge || 0}</span>
                  </div>
                </div>
              )}

              <div className="price-summary-box">
                <h3 style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: '700', marginBottom: '12px' }}>Price Summary</h3>
                <div className="summary-row">
                  <span>Selected Meals ({[selectedMeals.breakfast && 'B', selectedMeals.lunch.selected && `L(${selectedMeals.lunch.type})`, selectedMeals.dinner.selected && `D(${selectedMeals.dinner.type})`].filter(Boolean).join(', ')})</span>
                  <span>{duration}</span>
                </div>
                {homeDelivery && (
                  <div className="summary-row">
                    <span>Home Delivery</span>
                    <span>+₹{mess.deliveryCharge || 0}</span>
                  </div>
                )}
                <div className="summary-row total-row">
                  <span>TOTAL</span>
                  <span style={{ color: '#F26B2E' }}>₹{calculateTotal()}</span>
                </div>
              </div>

              <button 
                className="submit-btn" 
                style={{ 
                  marginBottom: '16px',
                  backgroundColor: userSubscriptions.some(s => s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'paused') ? '#9E9E9E' : 'var(--orange)',
                  cursor: userSubscriptions.some(s => s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'paused') ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleSubscribe}
              >
                {userSubscriptions.some(s => s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'paused') 
                  ? 'ALREADY SUBSCRIBED' 
                  : 'SUBSCRIBE'}
              </button>
              
              {userSubscriptions.some(s => s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'paused') && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#F44336', marginBottom: '16px', fontWeight: '600' }}>
                  Please wait until your current plan expires to subscribe to a new mess.
                </div>
              )}
              
              {!user && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#7E7E7E' }}>
                  <Link to="/login" style={{ color: '#F26B2E', textDecoration: 'none', fontWeight: '600' }}>Login</Link> to subscribe to this mess
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Embedded Google Map Footer Section */}
      {(() => {
        const rawUrl = mess.googleMapUrl || '';
        let mapSrc = '';
        if (rawUrl.trim()) {
          if (rawUrl.includes('<iframe')) {
            // Extract src from full iframe embed code
            const match = rawUrl.match(/src=["']([^"']+)["']/);
            mapSrc = match ? match[1] : '';
          } else if (rawUrl.includes('google.com/maps/embed')) {
            mapSrc = rawUrl.trim();
          } else {
            // Regular links can't be embedded directly. Build an embed URL from coords or address.
            if (mess.latitude && mess.longitude) {
              mapSrc = `https://maps.google.com/maps?q=${mess.latitude},${mess.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            } else {
              mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mess.fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            }
          }
        } else {
          // If no link provided, try to show the map based on location anyway
          if (mess.latitude && mess.longitude) {
            mapSrc = `https://maps.google.com/maps?q=${mess.latitude},${mess.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          } else if (mess.fullAddress && mess.fullAddress !== "Address not provided") {
            mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mess.fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          }
        }
        if (!mapSrc) return null;
        return (
          <div style={{ padding: '0 24px 40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>📍 Mess Location</h2>
            <div style={{ width: '100%', height: '380px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #F0F0F0' }}>
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mess Location Map"
              ></iframe>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}

export default MessDetail;
