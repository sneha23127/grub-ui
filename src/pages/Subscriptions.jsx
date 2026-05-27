import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

function Subscriptions() {
  const [activeTab, setActiveTab] = useState('Active');
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const userId = user ? user.id : 'guest';

  // State for dynamic lists
  const [activeList, setActiveList] = useState(() => {
    return JSON.parse(localStorage.getItem(`activeSubscriptions_${userId}`) || '[]');
  });
  const [pausedList, setPausedList] = useState(() => {
    return JSON.parse(localStorage.getItem(`pausedSubscriptions_${userId}`) || '[]');
  });
  const [pastList, setPastList] = useState(() => {
    return JSON.parse(localStorage.getItem(`pastSubscriptions_${userId}`) || '[]');
  });

  const [feedbackTarget, setFeedbackTarget] = useState(null); // Mess name for feedback
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [complaintMsg, setComplaintMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('review'); // 'review' or 'complaint'
  const [rating, setRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [pauseTargetId, setPauseTargetId] = useState(null);
  const [pauseStartDate, setPauseStartDate] = useState('');
  const [pauseEndDate, setPauseEndDate] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchSubscriptions = async () => {
      if (!user || !user.id) return;
      try {
        const response = await fetch(`http://localhost:5000/api/subscriptions/user/${user.id}`);
        const data = await response.json();

        if (data.status === 'success') {
          const mappedSubs = data.subscriptions.map(sub => ({
            id: sub.id,
            name: sub.mess_name,
            cuisine: sub.cuisine_type || 'Indian',
            diet: sub.meal_preference || 'Veg/Non-Veg',
            meals: sub.meals,
            delivery: sub.delivery_type,
            dateLabel: sub.status === 'ACTIVE' ? 'Renews' : 'Expired',
            dateVal: new Date(sub.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            statusType: sub.status,
            messId: sub.owner_id,
            image: `https://placehold.co/150x150/F26B2E/FFFFFF?text=${sub.mess_name.charAt(0)}`,
            pauseStart: sub.pause_start_date ? new Date(sub.pause_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
            pauseEnd: sub.pause_end_date ? new Date(sub.pause_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
          }));

          const active = mappedSubs.filter(s => s.statusType === 'ACTIVE');
          const past = mappedSubs.filter(s => s.statusType === 'EXPIRED' || s.statusType === 'CANCELLED');
          const paused = mappedSubs.filter(s => s.statusType === 'PAUSED');

          setActiveList(active);
          setPastList(past);
          setPausedList(paused);

          // Sync to localStorage as well for offline/fast load
          localStorage.setItem(`activeSubscriptions_${user.id}`, JSON.stringify(active));
          localStorage.setItem(`pausedSubscriptions_${user.id}`, JSON.stringify(paused));
          localStorage.setItem(`pastSubscriptions_${user.id}`, JSON.stringify(past));
        }
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      }
    };

    fetchSubscriptions();
  }, []);

  // Sync state to localStorage whenever lists change
  useEffect(() => {
    localStorage.setItem(`activeSubscriptions_${userId}`, JSON.stringify(activeList));
  }, [activeList, userId]);

  useEffect(() => {
    localStorage.setItem(`pausedSubscriptions_${userId}`, JSON.stringify(pausedList));
  }, [pausedList, userId]);

  useEffect(() => {
    localStorage.setItem(`pastSubscriptions_${userId}`, JSON.stringify(pastList));
  }, [pastList, userId]);

  // Action Handlers
  const handleUpdateStatus = async (id, newStatus, extraData = {}) => {
    try {
      const response = await fetch(`http://localhost:5000/api/subscriptions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      const data = await response.json();
      if (data.status === 'success') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handlePauseClick = (id) => {
    setPauseTargetId(id);
    setPauseStartDate('');
    setPauseEndDate('');
  };

  const handlePauseSubmit = () => {
    if (!pauseStartDate || !pauseEndDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const start = new Date(pauseStartDate);
    const end = new Date(pauseEndDate);
    const diffTime = Math.abs(end - start);
    // Add 1 to make it inclusive
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (start > end) {
      alert("End date cannot be before start date.");
      return;
    }

    if (diffDays < 5) {
      alert(`You must pause for a minimum of 5 days. Currently selected: ${diffDays} day(s).`);
      return;
    }

    handleUpdateStatus(pauseTargetId, 'PAUSED', { pause_start_date: pauseStartDate, pause_end_date: pauseEndDate });
  };

  const handleCancel = (id) => {
    if (window.confirm(`Are you sure you want to cancel this subscription? This cannot be undone.`)) {
      handleUpdateStatus(id, 'CANCELLED');
    }
  };


  const handleSubmitFeedback = async () => {
    const currentMsg = feedbackType === 'review' ? reviewMsg : complaintMsg;
    if (!currentMsg.trim()) return;
    if (feedbackType === 'review' && rating === 0) {
      alert("Please select a star rating for your review.");
      return;
    }
    if (feedbackType === 'complaint' && !feedbackSubject.trim()) {
      alert("Please provide a subject for your complaint.");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const axios = (await import('axios')).default;
      if (feedbackType === 'review') {
        await axios.post('http://localhost:5000/api/reviews', {
          user_id: user.id,
          user_name: user.name,
          mess_name: feedbackTarget,
          rating: rating,
          comment: reviewMsg
        });
        alert('Thank you for your review! It will be visible to other students.');
      } else {
        await axios.post('http://localhost:5000/api/tickets', {
          user_id: user.id,
          user_name: user.name,
          mess_name: feedbackTarget,
          subject: feedbackSubject,
          description: complaintMsg,
          category: 'Complaint',
          priority: 'High'
        });
        alert('Your complaint has been sent directly to the mess owner for resolution.');
      }
      setFeedbackTarget(null);
      setReviewMsg('');
      setComplaintMsg('');
      setFeedbackSubject('');
      setRating(0);
    } catch (error) {
      console.error('Feedback error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getDietStyle = (diet) => {
    const d = diet ? diet.toUpperCase() : '';
    return d === 'VEG' ? { color: '#4CAF50', fontWeight: '600' } : { color: '#FF5252', fontWeight: '600' };
  };

  const getStatusPill = (statusType) => {
    if (statusType === 'ACTIVE') {
      return <span className="pill-active">ACTIVE</span>;
    }
    if (statusType === 'EXPIRED') {
      return <span className="pill-expired">CANCELLED</span>;
    }
    if (statusType === 'PAUSED') {
      return <span className="pill-paused">PAUSED</span>;
    }
    return null;
  };

  const renderActiveList = () => (
    <>
      <div className="subs-list-wrapper">
        {activeList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7E7E7E', border: '1px dashed #DDD', borderRadius: '12px' }}>
            No active subscriptions.
          </div>
        ) : activeList.map(sub => (
          <div key={sub.id} className="subs-card">
            <div className="subs-card-img">
              <img src={sub.image} alt={sub.name} />
            </div>
            <div className="subs-card-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className="subs-card-title">{sub.name}</h3>
                {getStatusPill(sub.statusType)}
              </div>
              <div className="subs-card-meta">
                {sub.cuisine} · <span style={getDietStyle(sub.diet)}>{sub.diet}</span>
              </div>
              <div className="subs-card-meta">
                <span className="icon">🍽️</span> {sub.meals} · {sub.delivery}
              </div>
              <div className="subs-card-meta" style={{ fontWeight: '600', color: '#1A1A1A' }}>
                {sub.dateLabel} {sub.dateVal}
              </div>
            </div>
            <div className="subs-card-actions">
              <button className="btn-action-outline" onClick={() => navigate(`/mess/${sub.messId}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                View Menu
              </button>
              <button className="btn-action-outline" style={{ color: '#555', borderColor: '#ccc' }} onClick={() => handlePauseClick(sub.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                Pause
              </button>
              <button className="btn-action-outline btn-outline-danger" onClick={() => handleCancel(sub.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Cancel
              </button>
              <button className="btn-action-solid" style={{ background: '#FFF0E6', color: '#F26B2E', border: '1px solid #F26B2E' }} onClick={() => { setFeedbackTarget(sub.name); setFeedbackType('review'); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Review / Complain
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderPausedList = () => (
    <div className="subs-list-wrapper">
      {pausedList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7E7E7E', border: '1px dashed #DDD', borderRadius: '12px' }}>
          No paused subscriptions.
        </div>
      ) : pausedList.map(sub => (
        <div key={sub.id} className="subs-card">
          <div className="subs-card-img">
            <img src={sub.image} alt={sub.name} />
          </div>
          <div className="subs-card-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="subs-card-title">{sub.name}</h3>
              {getStatusPill(sub.statusType)}
            </div>
            <div className="subs-card-meta">
              {sub.cuisine} · <span style={getDietStyle(sub.diet)}>{sub.diet}</span>
            </div>
            <div className="subs-card-meta">
              <span className="icon">🍽️</span> {sub.meals} · {sub.delivery}
            </div>
            {sub.pauseStart && sub.pauseEnd ? (
              <div className="subs-card-meta" style={{ color: '#E65100', fontWeight: '600', backgroundColor: '#FFF3E0', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', width: 'fit-content', marginTop: '6px', fontSize: '13px' }}>
                Paused: {sub.pauseStart} to {sub.pauseEnd}
              </div>
            ) : (
              <div className="subs-card-meta" style={{ color: '#FF9800', fontWeight: '600' }}>
                {sub.dateLabel} {sub.dateVal}
              </div>
            )}
          </div>
          <div className="subs-card-actions">
            <button className="btn-action-outline btn-outline-danger" onClick={() => handleCancel(sub.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPastList = () => (
    <div className="subs-list-wrapper">
      {pastList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7E7E7E', border: '1px dashed #DDD', borderRadius: '12px' }}>
          No subscription history found.
        </div>
      ) : pastList.map(sub => (
        <div key={sub.id} className="subs-card">
          <div className="subs-card-img">
            <img src={sub.image} alt={sub.name} />
          </div>
          <div className="subs-card-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="subs-card-title">{sub.name}</h3>
              {getStatusPill(sub.statusType)}
            </div>
            <div className="subs-card-meta">
              {sub.cuisine} · <span style={getDietStyle(sub.diet)}>{sub.diet}</span>
            </div>
            <div className="subs-card-meta">
              <span className="icon">🍽️</span> {sub.meals} · {sub.delivery}
            </div>
            <div className="subs-card-meta" style={{ color: '#7E7E7E' }}>
              {sub.dateLabel} {sub.dateVal}
            </div>
            <a href="#review" style={{ display: 'inline-block', marginTop: '4px', fontSize: '13px', color: '#F26B2E', textDecoration: 'underline' }}>
              Write a review →
            </a>
          </div>
          <div className="subs-card-actions">
            <button className="btn-action-solid">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12A10 10 0 1 1 12 2v4a6 6 0 1 0 6 6z"></path><polyline points="22 2 22 12 12 12"></polyline></svg>
              Resubscribe
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="subscription-page " style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <NavBar />

      <main className="container" style={{ flex: 1, padding: '40px 20px', width: '100%', maxWidth: '1000px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>My Subscriptions</h1>
        <p style={{ color: '#7E7E7E', fontSize: '15px', marginBottom: '40px' }}>
          Manage your active mess plans and subscription history.
        </p>

        <div className="subs-tabs-container">
          <div
            className={`subs-tab ${activeTab === 'Active' ? 'active' : ''}`}
            onClick={() => setActiveTab('Active')}
          >
            Active <span className="badge-circle">{activeList.length}</span>
          </div>
          <div
            className={`subs-tab ${activeTab === 'Paused' ? 'active' : ''}`}
            onClick={() => setActiveTab('Paused')}
          >
            Paused <span className="badge-circle">{pausedList.length}</span>
          </div>
          <div
            className={`subs-tab ${activeTab === 'Past' ? 'active' : ''}`}
            onClick={() => setActiveTab('Past')}
          >
            Past <span className="badge-circle">{pastList.length}</span>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          {activeTab === 'Active' && renderActiveList()}
          {activeTab === 'Paused' && renderPausedList()}
          {activeTab === 'Past' && renderPastList()}
        </div>


        {/* Feedback Modal */}
        {feedbackTarget && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '90%', position: 'relative' }}>
              <button onClick={() => setFeedbackTarget(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #EEE' }}>
                <button
                  onClick={() => setFeedbackType('review')}
                  style={{ padding: '10px 0', border: 'none', background: 'none', fontSize: '16px', fontWeight: '700', color: feedbackType === 'review' ? 'var(--orange)' : '#7E7E7E', borderBottom: feedbackType === 'review' ? '3px solid var(--orange)' : '3px solid transparent', cursor: 'pointer' }}
                >
                  Public Review
                </button>
                <button
                  onClick={() => setFeedbackType('complaint')}
                  style={{ padding: '10px 0', border: 'none', background: 'none', fontSize: '16px', fontWeight: '700', color: feedbackType === 'complaint' ? 'var(--orange)' : '#7E7E7E', borderBottom: feedbackType === 'complaint' ? '3px solid var(--orange)' : '3px solid transparent', cursor: 'pointer' }}
                >
                  Private Complaint
                </button>
              </div>

              {feedbackType === 'review' ? (
                <>
                  <p style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '16px' }}>Rate your experience with {feedbackTarget}. This will be public.</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer', fontSize: '24px', color: star <= rating ? '#FFD700' : '#DDD' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '16px' }}>Report an issue directly to the mess owner. This is private.</p>
                  <input
                    type="text"
                    placeholder="Subject (e.g., Delivery Delay, Quality Issue)"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DDD', marginBottom: '16px', fontFamily: 'inherit' }}
                  />
                </>
              )}

              <textarea
                placeholder={feedbackType === 'review' ? "Write your review here..." : "Describe your complaint in detail..."}
                value={feedbackType === 'review' ? reviewMsg : complaintMsg}
                onChange={(e) => feedbackType === 'review' ? setReviewMsg(e.target.value) : setComplaintMsg(e.target.value)}
                style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #DDD', marginBottom: '24px', fontFamily: 'inherit', resize: 'none' }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-action-outline" style={{ flex: 1 }} onClick={() => setFeedbackTarget(null)}>Cancel</button>
                <button
                  className="btn-action-solid"
                  style={{ flex: 2, background: isSubmittingFeedback || !(feedbackType === 'review' ? reviewMsg : complaintMsg).trim() || (feedbackType === 'review' && rating === 0) ? '#CCC' : 'var(--orange)' }}
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback || !(feedbackType === 'review' ? reviewMsg : complaintMsg).trim() || (feedbackType === 'review' && rating === 0)}
                >
                  {isSubmittingFeedback ? 'Submitting...' : `Submit ${feedbackType === 'review' ? 'Review' : 'Complaint'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Modal */}
        {pauseTargetId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', position: 'relative' }}>
              <button onClick={() => setPauseTargetId(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>

              <h2 style={{ marginBottom: '16px', color: '#1A1A1A' }}>Pause Subscription</h2>
              <p style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '20px' }}>
                You can pause your mess subscription for a minimum of 5 days. It will automatically resume after the end date.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>From Date:</label>
                <input
                  type="date"
                  value={pauseStartDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPauseStartDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DDD', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>To Date (Min 5 days):</label>
                <input
                  type="date"
                  value={pauseEndDate}
                  min={pauseStartDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPauseEndDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DDD', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-action-outline" style={{ flex: 1 }} onClick={() => setPauseTargetId(null)}>Cancel</button>
                <button
                  className="btn-action-solid"
                  style={{ flex: 1, background: '#F26B2E' }}
                  onClick={handlePauseSubmit}
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Subscriptions;
