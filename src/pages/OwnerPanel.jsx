import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function OwnerPanel() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 2)); // April 2, 2026

  // Get user from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'mess_owner') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'mess_owner') {
    return null; // Or a loading spinner
  }

  // Real Data Only - No Dummy Data
  const [messInfo, setMessInfo] = useState({
    id: user?.id,
    name: user?.mess_name || "New Mess",
    owner: user?.name || "",
    initials: (user?.name || "N").split(' ').map(n => n[0]).join('').toUpperCase(),
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.address || "Not set",
    type: user?.details?.type || "",
    tag: user?.details?.tag || "",
    activeSubscribers: user?.details?.activeSubscribers || 0,
    totalSlots: user?.details?.totalSlots || 0,
    todayRevenue: user?.details?.todayRevenue || 0,
    avgRating: user?.details?.avgRating || 0,
    totalReviews: user?.details?.totalReviews || 0,
    joined: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Recently Joined",
    pricing: user?.details?.pricing || { breakfast: 0, breakfastVeg: 0, breakfastNonVeg: 0, lunchVeg: 0, lunchNonVeg: 0, dinnerVeg: 0, dinnerNonVeg: 0 },
    timings: user?.details?.timings || { breakfast: "00:00 AM - 00:00 AM", lunch: "00:00 PM - 00:00 PM", dinner: "00:00 PM - 00:00 PM" },
    subscriptionPlans: user?.details?.subscriptionPlans || { trialVeg: 0, trialNonVeg: 0, oneMonthVeg: 0, oneMonthNonVeg: 0, threeMonthVeg: 0, threeMonthNonVeg: 0 },
    homeDelivery: user?.details?.homeDelivery || false,
    deliveryCharge: user?.details?.deliveryCharge || 0,
    paymentOptions: user?.details?.paymentOptions || { upi: false, cash: false },
    image: user?.details?.image || null,
    googleMapUrl: user?.details?.googleMapUrl || ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editOwnerData, setEditOwnerData] = useState({ ...messInfo });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("Image file size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditOwnerData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [menuData, setMenuData] = useState(user.menu_data || {
    'Mon': { breakfast: [], lunch: [], dinner: [] },
    'Tue': { breakfast: [], lunch: [], dinner: [] },
    'Wed': { breakfast: [], lunch: [], dinner: [] },
    'Thu': { breakfast: [], lunch: [], dinner: [] },
    'Fri': { breakfast: [], lunch: [], dinner: [] },
    'Sat': { breakfast: [], lunch: [], dinner: [] },
    'Sun': { breakfast: [], lunch: [], dinner: [] },
  });

  const [activeDay, setActiveDay] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]);
  const [newItemInputs, setNewItemInputs] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [editingItem, setEditingItem] = useState(null); // { mealType, id, name }

  const saveProfile = async () => {
    try {
      const dailyRate = editOwnerData.pricing;
      const details = {
        type: editOwnerData.type,
        tag: editOwnerData.tag,
        activeSubscribers: editOwnerData.activeSubscribers,
        totalSlots: editOwnerData.totalSlots,
        avgRating: editOwnerData.avgRating,
        totalReviews: editOwnerData.totalReviews,
        pricing: editOwnerData.pricing,
        timings: editOwnerData.timings,
        subscriptionPlans: {
          trialVeg: (dailyRate.breakfast + dailyRate.lunchVeg + dailyRate.dinnerVeg) * 15,
          trialNonVeg: (dailyRate.lunchNonVeg + dailyRate.dinnerNonVeg) * 15,
          oneMonthVeg: (dailyRate.breakfast + dailyRate.lunchVeg + dailyRate.dinnerVeg) * 30,
          oneMonthNonVeg: (dailyRate.lunchNonVeg + dailyRate.dinnerNonVeg) * 30,
          threeMonthVeg: (dailyRate.breakfast + dailyRate.lunchVeg + dailyRate.dinnerVeg) * 90,
          threeMonthNonVeg: (dailyRate.lunchNonVeg + dailyRate.dinnerNonVeg) * 90
        },
        homeDelivery: editOwnerData.homeDelivery,
        deliveryCharge: editOwnerData.deliveryCharge,
        paymentOptions: editOwnerData.paymentOptions || { upi: true, cash: true },
        image: editOwnerData.image,
        googleMapUrl: editOwnerData.googleMapUrl || ''
      };

      const res = await axios.post('http://localhost:5000/api/users/update-profile', {
        id: messInfo.id,
        name: editOwnerData.owner,
        mess_name: editOwnerData.name,
        phone: editOwnerData.phone,
        address: editOwnerData.location,
        email: editOwnerData.email,
        details: details
      });

      if (res.data.status === 'success') {
        const updatedUser = res.data.user;
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessInfo({ 
          id: updatedUser.id,
          name: updatedUser.mess_name,
          owner: updatedUser.name,
          initials: updatedUser.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.address,
          ...updatedUser.details,
          joined: updatedUser.created_at ? new Date(updatedUser.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : messInfo.joined
        });
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const saveMenu = async (updatedMenu) => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/update-menu', {
        id: messInfo.id,
        menu_data: updatedMenu
      });

      if (res.data.status === 'success') {
        const updatedUser = { ...user, menu_data: updatedMenu };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMenuData(updatedMenu);
        console.log('Menu updated in DB and LocalStorage');
      }
    } catch (error) {
      console.error('Error updating menu:', error);
      alert('Error saving menu. Please check your connection.');
    }
  };

  const handleUpdateItemStatus = (mealType, itemId) => {
    const updatedMenu = { ...menuData };
    const items = updatedMenu[activeDay][mealType];
    const itemIndex = items.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
      items[itemIndex].status = items[itemIndex].status === 'Available' ? 'Unavailable' : 'Available';
      saveMenu(updatedMenu);
    }
  };

  const handleAddItem = (mealType) => {
    const name = newItemInputs[mealType];
    if (name.trim()) {
      const updatedMenu = { ...menuData };
      if (!updatedMenu[activeDay]) updatedMenu[activeDay] = { breakfast: [], lunch: [], dinner: [] };
      if (!updatedMenu[activeDay][mealType]) updatedMenu[activeDay][mealType] = [];
      
      const newId = Date.now();
      updatedMenu[activeDay][mealType].push({ id: newId, name, status: 'Available' });
      saveMenu(updatedMenu);
      setNewItemInputs({ ...newItemInputs, [mealType]: '' });
    }
  };

  const handleDeleteItem = (mealType, itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedMenu = { ...menuData };
      updatedMenu[activeDay][mealType] = updatedMenu[activeDay][mealType].filter(i => i.id !== itemId);
      saveMenu(updatedMenu);
    }
  };

  const handleEditItem = (mealType, item) => {
    setEditingItem({ mealType, id: item.id, name: item.name });
  };

  const saveItemEdit = () => {
    if (!editingItem) return;
    const updatedMenu = { ...menuData };
    const items = updatedMenu[activeDay][editingItem.mealType];
    const itemIndex = items.findIndex(i => i.id === editingItem.id);
    
    if (itemIndex > -1) {
      items[itemIndex].name = editingItem.name;
      saveMenu(updatedMenu);
      setEditingItem(null);
    }
  };

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: 'grid' },
    { id: 'Manage Mess', label: 'Manage Mess', icon: 'utensils' },
    { id: 'Subscribers', label: 'Subscribers', icon: 'users' },
    { id: 'Payments & Earnings', label: 'Payments & Earnings', icon: 'dollar-sign' },
    { id: 'Feedback', label: 'Feedback', icon: 'message-square' },
  ];

  const [subscribers, setSubscribers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showSubPassword, setShowSubPassword] = useState(false);
  const [newSubData, setNewSubData] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    address: '',
    password: '',
    selectedMeals: {
      breakfast: true,
      lunch: { selected: true, type: 'Veg' },
      dinner: { selected: false, type: 'Veg' }
    },
    plan_duration: '1 Month',
    homeDelivery: false,
    payment_method: 'Cash',
    total_amount: '0'
  });

  const fetchStudentsList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users');
      if (response.data.status === 'success') {
        const students = response.data.users.filter(u => u.role === 'student' || u.role === 'user');
        setStudentsList(students);
      }
    } catch (error) {
      console.error('Error fetching students list:', error);
    }
  };

  const closeAddSubModal = () => {
    setIsAddUserModalOpen(false);
    setShowSubPassword(false);
  };

  useEffect(() => {
    let dailyCost = 0;
    if (newSubData.selectedMeals?.breakfast) {
      dailyCost += Number(messInfo.pricing?.breakfast || 0);
    }
    if (newSubData.selectedMeals?.lunch?.selected) {
      const type = newSubData.selectedMeals.lunch.type === 'Non-Veg' ? 'lunchNonVeg' : 'lunchVeg';
      dailyCost += Number(messInfo.pricing?.[type] || 0);
    }
    if (newSubData.selectedMeals?.dinner?.selected) {
      const type = newSubData.selectedMeals.dinner.type === 'Non-Veg' ? 'dinnerNonVeg' : 'dinnerVeg';
      dailyCost += Number(messInfo.pricing?.[type] || 0);
    }

    let days = 30;
    if (newSubData.plan_duration === 'Trial (15 Days)') days = 15;
    else if (newSubData.plan_duration === '3 Months') days = 90;
    
    let total = dailyCost * days;
    
    const isHomeDeliveryEnabled = messInfo.homeDelivery === true || messInfo.homeDelivery === 'true';
    if (newSubData.homeDelivery && isHomeDeliveryEnabled) {
      total += Number(messInfo.deliveryCharge || 0);
    }
    
    setNewSubData(prev => ({ ...prev, total_amount: total.toString() }));
  }, [
    newSubData.selectedMeals, 
    newSubData.plan_duration, 
    newSubData.homeDelivery, 
    messInfo.pricing, 
    messInfo.homeDelivery, 
    messInfo.deliveryCharge
  ]);

  const fetchSubscribers = async () => {
    if (!messInfo.name) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/subscriptions/mess/${encodeURIComponent(messInfo.name)}`);
      if (response.data.status === 'success') {
        const subData = response.data.subscriptions.map(s => ({
          id: s.id,
          userId: s.user_id,
          name: s.user_name,
          phone: s.user_phone,
          email: s.user_email || 'N/A',
          address: s.user_address || 'N/A',
          plan: s.plan_duration,
          startDate: new Date(s.created_at).toLocaleDateString('en-GB'),
          endDate: new Date(s.expiry_date).toLocaleDateString('en-GB'),
          status: s.status,
          meals: s.meals,
          amount: s.total_amount,
          createdAt: s.created_at,
          deliveryType: s.delivery_type || 'Dine-in',
          paymentMethod: s.payment_method || 'Cash',
          pauseStartDate: s.pause_start_date ? new Date(s.pause_start_date).toLocaleDateString('en-GB') : null,
          pauseEndDate: s.pause_end_date ? new Date(s.pause_end_date).toLocaleDateString('en-GB') : null,
        }));
        setSubscribers(subData);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    if (!messInfo.name) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/mess/${encodeURIComponent(messInfo.name)}`);
      if (response.data.status === 'success') {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchReviews();
  }, [messInfo.name]);

  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0 
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / totalReviewsCount).toFixed(1)
    : 0;

  const handleUpdateSubscriberStatus = async (subId, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/subscriptions/${subId}/status`, { status: newStatus });
      if (res.data.status === 'success') {
        fetchSubscribers();
        alert(`Subscriber status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating subscriber status:', err);
      alert('Failed to update status.');
    }
  };

  const handleDeleteSubscriber = async (userId) => {
    if (!window.confirm('Are you sure you want to completely delete this user from the database? This cannot be undone.')) {
      return;
    }
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
      if (res.data.status === 'success') {
        fetchSubscribers();
        alert('User deleted completely from the database.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  const transactions = subscribers.map(s => {
    const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = ['#F26B2E', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: `TXN-${s.id.toString().padStart(6, '0')}`,
      name: s.name,
      amount: s.amount || 0,
      date: s.startDate,
      status: 'Paid',
      initials,
      color: randomColor
    };
  });

  const recentActivity = subscribers.slice(0, 5).map(s => ({
    id: s.id,
    user: s.name,
    type: 'subscription',
    icon: 'users',
    bg: '#FFF0E6',
    color: '#F26B2E',
    plan: s.plan,
    amount: s.amount,
    time: new Date(s.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    status: s.status
  }));

  // Calculate earnings for stats
  const calculateEarnings = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const stats = {
      today: 0, todayCount: 0,
      week: 0, weekCount: 0,
      month: 0, monthCount: 0,
      total: 0
    };

    subscribers.forEach(s => {
      const date = new Date(s.createdAt);
      const amount = parseFloat(s.amount) || 0;
      stats.total += amount;

      if (date >= today) {
        stats.today += amount;
        stats.todayCount++;
      }
      if (date >= weekAgo) {
        stats.week += amount;
        stats.weekCount++;
      }
      if (date >= monthAgo) {
        stats.month += amount;
        stats.monthCount++;
      }
    });

    return stats;
  };

  const earningStats = calculateEarnings();

  // Ticket state + fetch
  const [ticketsList, setTicketsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [feedbackSubTab, setFeedbackSubTab] = useState('Complaints');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reviews/mess/${encodeURIComponent(messInfo.name)}`);
        if (response.data.status === 'success') {
          setReviewsList(response.data.reviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    if (messInfo.name) fetchReviews();
  }, [messInfo.name]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/owner/tickets?mess_name=${encodeURIComponent(messInfo.name)}`);
        if (response.data.status === 'success') {
          setTicketsList(response.data.tickets.map(t => ({
            id: t.ticket_id,
            user: t.user_name,
            subject: t.subject,
            description: t.description,
            status: t.status,
            date: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'
          })));
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };
    if (messInfo.name) fetchTickets();
  }, [messInfo.name]);

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.post('http://localhost:5000/api/admin/update-ticket-status', { ticket_id: ticketId, status: newStatus });
      setTicketsList(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Open': { bg: '#FFEBEE', text: '#F44336' },
      'In Progress': { bg: '#FFF3E0', text: '#E65100' },
      'Resolved': { bg: '#E8F5E9', text: '#4CAF50' },
      'Closed': { bg: '#F5F5F5', text: '#7E7E7E' }
    };
    const style = colors[status] || { bg: '#F5F5F5', text: '#7E7E7E' };
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: style.bg, color: style.text }}>{status}</span>;
  };

  const renderFeedback = () => {
    const filteredComplaints = ticketsList.filter(t => {
      const matchSearch = !ticketSearch || t.id.toLowerCase().includes(ticketSearch.toLowerCase()) || t.user.toLowerCase().includes(ticketSearch.toLowerCase()) || t.subject.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchStatus = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="admin-view">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title-sm">Feedback & Reputation</h1>
            <p className="table-subtitle" style={{ marginTop: 4 }}>Manage private complaints and monitor your public reviews.</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', gap: 24, marginTop: 24, borderBottom: '1px solid #EEE' }}>
          <button 
            onClick={() => setFeedbackSubTab('Complaints')}
            style={{ padding: '12px 4px', border: 'none', background: 'none', fontSize: 15, fontWeight: 700, color: feedbackSubTab === 'Complaints' ? 'var(--orange)' : '#7E7E7E', borderBottom: feedbackSubTab === 'Complaints' ? '3px solid var(--orange)' : '3px solid transparent', cursor: 'pointer' }}
          >
            Private Complaints ({ticketsList.length})
          </button>
          <button 
            onClick={() => setFeedbackSubTab('Reviews')}
            style={{ padding: '12px 4px', border: 'none', background: 'none', fontSize: 15, fontWeight: 700, color: feedbackSubTab === 'Reviews' ? 'var(--orange)' : '#7E7E7E', borderBottom: feedbackSubTab === 'Reviews' ? '3px solid var(--orange)' : '3px solid transparent', cursor: 'pointer' }}
          >
            Public Reviews ({reviewsList.length})
          </button>
        </div>

        {feedbackSubTab === 'Complaints' ? (
          <>
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 24, marginBottom: 24 }}>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Total Complaints</div><div className="stat-value">{ticketsList.length}</div></div>
              </div>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Pending</div><div className="stat-value" style={{ color: '#F44336' }}>{ticketsList.filter(t => t.status === 'Open').length}</div></div>
              </div>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Resolved</div><div className="stat-value" style={{ color: '#4CAF50' }}>{ticketsList.filter(t => t.status === 'Resolved').length}</div></div>
              </div>
            </div>

            <div className="admin-table-panel">
              <div className="table-toolbar">
                <div className="search-input-wrap" style={{ width: 280 }}>
                  <span style={{ opacity: 0.4 }}>🔍</span>
                  <input type="text" placeholder="Search complaints..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={ticketStatusFilter} onChange={e => setTicketStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>User Name</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No complaints received yet.</td></tr>
                  ) : filteredComplaints.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: '#1A1A1A', fontSize: 13 }}>{t.id}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{t.user}</td>
                      <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{t.subject}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-sm btn-outline-dark" onClick={() => setSelectedTicket(t)}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 24, marginBottom: 24 }}>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Total Reviews</div><div className="stat-value">{reviewsList.length}</div></div>
              </div>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Average Rating</div><div className="stat-value" style={{ color: '#FF9800' }}>
                  {reviewsList.length > 0 ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1) : '0.0'} ★
                </div></div>
              </div>
              <div className="admin-stat-box-sm">
                <div><div className="stat-label">Top Rated</div><div className="stat-value" style={{ color: '#2196F3' }}>{reviewsList.filter(r => r.rating === 5).length}</div></div>
              </div>
            </div>

            <div className="admin-table-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No public reviews yet.</td></tr>
                  ) : reviewsList.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{r.user_name}</td>
                      <td>
                        <div style={{ color: '#FFD700', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      </td>
                      <td style={{ fontSize: 13, color: '#555', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.comment}</td>
                      <td style={{ fontSize: 12, color: '#7E7E7E' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Manage Modal */}
        {selectedTicket && (
          <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="admin-modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">{selectedTicket.id}</h2>
                  <div className="modal-subtitle">From: {selectedTicket.user} · {selectedTicket.date}</div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
              </div>
              <div className="modal-body-scroll">
                <div style={{ marginBottom: 20 }}>{getStatusBadge(selectedTicket.status)}</div>
                <div className="modal-section" style={{ background: '#F9F9F9', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 4 }}>Subject</div>
                  <div style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600, marginBottom: 8 }}>{selectedTicket.subject}</div>
                  <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 4 }}>Message</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{selectedTicket.description || 'No additional details provided.'}</div>
                </div>
                <div className="modal-section" style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 12 }}>Quick Actions</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-sm btn-success" style={{ flex: 1 }} disabled={selectedTicket.status === 'Resolved'} onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Resolved')}>
                      {selectedTicket.status === 'Resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                    </button>
                    <button className="btn-sm btn-outline-dark" style={{ flex: 1 }} onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'In Progress')}>
                      Set In Progress
                    </button>
                    <button className="btn-sm btn-danger" style={{ flex: 1 }} onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Closed')}>
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Icon Component
  const Icon = ({ name, size = 18 }) => {
    const svgs = {
      'grid': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
      'utensils': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>,
      'users': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      'dollar-sign': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
      'trending-up': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
      'star': <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
      'user-plus': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>,
      'user-minus': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
      'alert-circle': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
      'chevron-left': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>,
      'chevron-right': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>,
      'edit': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
      'trash': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
      'power': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>,
      'message-square': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
      'search': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
      'download': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
      'user': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
      'mail': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
      'phone': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
      'map-pin': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
      'settings': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    };
    return svgs[name] || null;
  };

  const renderOverview = () => (
    <div className="owner-view">
      <div className="admin-header-box">
        <h1 className="admin-title">Good morning, {messInfo.owner}! 👋</h1>
        <p className="admin-subtitle">Here is how {messInfo.name} is doing today.</p>
        <div className="admin-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Total Subscribers</div>
            <div className="stat-value">{subscribers.length}</div>
          </div>
          <div className="stat-icon-wrap icon-blue"><Icon name="users" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Active Subscribers</div>
            <div className="stat-value">{subscribers.filter(s => s.status.toLowerCase() === 'active').length}</div>
          </div>
          <div className="stat-icon-wrap icon-orange"><Icon name="users" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">₹0</div>
          </div>
          <div className="stat-icon-wrap icon-green"><Icon name="dollar-sign" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Average Rating</div>
            <div className="stat-value">{avgRating}</div>
            <div className="owner-stat-subtext" style={{ marginTop: 4 }}>from {totalReviewsCount} reviews</div>
          </div>
          <div className="stat-icon-wrap icon-yellow"><Icon name="star" size={20} /></div>
        </div>
      </div>

      <div className="owner-section-title">
        <h2>Recent activity</h2>
        <button className="owner-view-all">View all</button>
      </div>

      <div className="owner-activity-list">
        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No recent activity yet.</div>
        ) : recentActivity.map(act => (
          <div key={act.id} className="owner-activity-item">
            <div className="owner-activity-icon" style={{ backgroundColor: act.bg, color: act.color }}>
              <Icon name={act.icon} size={18} />
            </div>
            <div className="owner-activity-content">
              <div className="owner-activity-main">
                <span className="owner-activity-user">{act.user}</span>
                <span className="owner-activity-action">
                  {act.type === 'subscription' && ' subscribed'}
                  {act.type === 'cancellation' && ' cancelled their plan'}
                  {act.type === 'payment' && ` Payment received from ${act.user}`}
                  {act.type === 'failed' && ` Payment failed for ${act.user}`}
                </span>
              </div>
              <div className="owner-activity-sub">
                {act.plan && <span>{act.plan}</span>}
                {act.amount && <span> • ₹{act.amount.toLocaleString()}</span>}
                {act.method && <span> • {act.method}</span>}
              </div>
            </div>
            <div className="owner-activity-right">
              <div className="owner-activity-time">{act.time}</div>
              {act.action && <button className="owner-remind-btn">{act.action}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="owner-view">
      <div style={{ marginTop: 0, marginBottom: 48, background: 'white', borderRadius: 16, border: '1px solid #EEE', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Personal Information</h2>
            <p style={{ fontSize: 14, color: '#7E7E7E', margin: '4px 0 0 0' }}>Manage your personal and mess contact details.</p>
          </div>
          {!isEditingProfile ? (
            <button className="owner-edit-btn" onClick={() => { setEditOwnerData({ ...messInfo }); setIsEditingProfile(true); }}>
              <Icon name="edit" size={14} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="owner-cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button className="owner-save-btn" onClick={saveProfile}>Save Changes</button>
            </div>
          )}
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              ['Owner Name', 'owner', 'user', 'text'],
              ['Mess Name', 'name', 'utensils', 'text'],
              ['Email Address', 'email', 'mail', 'text'],
              ['Phone Number', 'phone', 'phone', 'text'],
              ['Location', 'location', 'map-pin', 'text'],
            ].map(([label, key, icon, inputType]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FFF4ED', color: '#F26B2E', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Icon name={icon} size={20} />
                </div>
                <div style={{ flex: 1, maxWidth: 400 }}>
                  <div style={{ fontSize: 13, color: '#7E7E7E', marginBottom: 4 }}>{label}</div>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={editOwnerData[key]} 
                      onChange={e => setEditOwnerData({ ...editOwnerData, [key]: e.target.value })}
                      style={{ fontSize: 15, border: '1px solid #DDD', borderRadius: 8, padding: '10px 14px', width: '100%', backgroundColor: '#FAFAFA' }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>{messInfo[key]}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageMenu = () => (
    <div className="owner-view">
      {/* Mess Configuration Section - Merged */}
      <div style={{ marginTop: 0, marginBottom: 48, background: 'white', borderRadius: 16, border: '1px solid #EEE', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Mess Configuration</h2>
            <p style={{ fontSize: 14, color: '#7E7E7E', margin: '4px 0 0 0' }}>Manage your pricing, timings, and service options.</p>
          </div>
          {!isEditingProfile ? (
            <button className="owner-edit-btn" onClick={() => { setEditOwnerData({ ...messInfo }); setIsEditingProfile(true); }}>
              <Icon name="edit" size={14} /> Edit Configuration
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="owner-cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button className="owner-save-btn" onClick={saveProfile}>Save Changes</button>
            </div>
          )}
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {[
              ['Cuisine Type', 'type', '', 'select', ['South Indian', 'North Indian']],
              ['Meal Preference', 'tag', '', 'select', ['Veg', 'Non-Veg', 'Veg & Non-Veg']],
            ].map(([label, key, icon, inputType, options]) => (
              <div key={label}>
                <div className="info-label">{label}</div>
                {isEditingProfile ? (
                  inputType === 'select' ? (
                    <select 
                      value={editOwnerData[key]} 
                      onChange={e => setEditOwnerData({ ...editOwnerData, [key]: e.target.value })}
                      style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '8px 12px', width: '100%', marginTop: 4, backgroundColor: 'white' }}
                    >
                      <option value="" disabled>Select {label}</option>
                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={editOwnerData[key]} 
                      onChange={e => setEditOwnerData({ ...editOwnerData, [key]: e.target.value })}
                      style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '8px 12px', width: '100%', marginTop: 4 }}
                    />
                  )
                ) : (
                  <div className="info-value" style={{ fontSize: 15, marginTop: 4 }}>{messInfo[key] || <span style={{color: '#9CA3AF', fontStyle: 'italic'}}>Not selected</span>}</div>
                )}
              </div>
            ))}
            
            <div>
              <div className="info-label" style={{ fontWeight: 600, color: '#4B5563', fontSize: 13 }}>Mess Photo</div>
              {isEditingProfile ? (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    style={{ fontSize: 12, color: '#4B5563' }}
                  />
                  {editOwnerData.image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img 
                        src={editOwnerData.image} 
                        alt="Preview" 
                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #DDD' }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setEditOwnerData(prev => ({ ...prev, image: null }))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: '600' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {messInfo.image ? (
                    <>
                      <img 
                        src={messInfo.image} 
                        alt="Mess" 
                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #DDD' }} 
                      />
                      <span style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>Uploaded Photo</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>No photo uploaded</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #EEE' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Meal Pricing (Daily Rates)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
              {/* Breakfast Pricing */}
              <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid #F0F0F0' }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Breakfast
                </div>
                {(isEditingProfile ? editOwnerData.tag : messInfo.tag) === 'Veg & Non-Veg' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="info-label">Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.breakfastVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, breakfastVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.breakfastVeg || 0}</div>
                      )}
                    </div>
                    <div>
                      <div className="info-label">Non-Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.breakfastNonVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, breakfastNonVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.breakfastNonVeg || 0}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="info-label">Price (₹)</div>
                    {isEditingProfile ? (
                      <input 
                        type="number" 
                        value={editOwnerData.pricing.breakfast} 
                        onChange={e => setEditOwnerData({ 
                          ...editOwnerData, 
                          pricing: { ...editOwnerData.pricing, breakfast: parseInt(e.target.value) || 0 } 
                        })}
                        style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                      />
                    ) : (
                      <div className="info-value" style={{ fontSize: 16, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.breakfast}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Lunch Pricing */}
              <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid #F0F0F0' }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Lunch
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: (isEditingProfile ? editOwnerData.tag : messInfo.tag) === 'Veg & Non-Veg' ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {(isEditingProfile ? editOwnerData.tag : messInfo.tag) !== 'Non-Veg' && (
                    <div>
                      <div className="info-label">Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.lunchVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, lunchVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.lunchVeg}</div>
                      )}
                    </div>
                  )}
                  {(isEditingProfile ? editOwnerData.tag : messInfo.tag) !== 'Veg' && (
                    <div>
                      <div className="info-label">Non-Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.lunchNonVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, lunchNonVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.lunchNonVeg}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dinner Pricing */}
              <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid #F0F0F0' }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Dinner
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: (isEditingProfile ? editOwnerData.tag : messInfo.tag) === 'Veg & Non-Veg' ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {(isEditingProfile ? editOwnerData.tag : messInfo.tag) !== 'Non-Veg' && (
                    <div>
                      <div className="info-label">Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.dinnerVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, dinnerVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.dinnerVeg}</div>
                      )}
                    </div>
                  )}
                  {(isEditingProfile ? editOwnerData.tag : messInfo.tag) !== 'Veg' && (
                    <div>
                      <div className="info-label">Non-Veg (₹)</div>
                      {isEditingProfile ? (
                        <input 
                          type="number" 
                          value={editOwnerData.pricing.dinnerNonVeg} 
                          onChange={e => setEditOwnerData({ 
                            ...editOwnerData, 
                            pricing: { ...editOwnerData.pricing, dinnerNonVeg: parseInt(e.target.value) || 0 } 
                          })}
                          style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                        />
                      ) : (
                        <div className="info-value" style={{ fontSize: 15, fontWeight: 700, color: '#F26B2E' }}>₹{messInfo.pricing.dinnerNonVeg}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #EEE' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Mess Timings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
              {['breakfast', 'lunch', 'dinner'].map(meal => (
                <div key={meal} style={{ background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid #F0F0F0' }}>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 16, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {meal}
                  </div>
                  <div>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={editOwnerData.timings[meal]} 
                        onChange={e => setEditOwnerData({ 
                          ...editOwnerData, 
                          timings: { ...editOwnerData.timings, [meal]: e.target.value } 
                        })}
                        style={{ fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '6px 10px', width: '100%', marginTop: 4 }}
                      />
                    ) : (
                      <div className="info-value" style={{ fontSize: 14 }}>{messInfo.timings[meal]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Delivery Section */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #EEE' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Home Delivery Service</h3>
            <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editOwnerData.homeDelivery && isEditingProfile ? 20 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Delivery Availability</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Toggle this to show students if you provide home delivery service.</div>
                  </div>
                </div>
                
                {isEditingProfile ? (
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                    <input 
                      type="checkbox" 
                      checked={editOwnerData.homeDelivery} 
                      onChange={e => setEditOwnerData({ ...editOwnerData, homeDelivery: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{ 
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: editOwnerData.homeDelivery ? '#F26B2E' : '#CBD5E1', 
                      transition: '.4s', borderRadius: 34 
                    }}>
                      <span style={{ 
                        position: 'absolute', content: '""', height: 18, width: 18, left: 4, bottom: 4, 
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                        transform: editOwnerData.homeDelivery ? 'translateX(24px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {messInfo.homeDelivery && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: 6 }}>
                        Charge: ₹{messInfo.deliveryCharge}
                      </div>
                    )}
                    <div style={{ 
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, 
                      backgroundColor: messInfo.homeDelivery ? '#DEF7EC' : '#F3F4F6',
                      color: messInfo.homeDelivery ? '#03543F' : '#4B5563'
                    }}>
                      {messInfo.homeDelivery ? '● ACTIVE' : '○ DISABLED'}
                    </div>
                  </div>
                )}
              </div>

              {editOwnerData.homeDelivery && isEditingProfile && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Delivery Charge (₹)</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Set the amount you charge for each delivery.</div>
                  </div>
                  <input 
                    type="number" 
                    value={editOwnerData.deliveryCharge} 
                    onChange={e => setEditOwnerData({ ...editOwnerData, deliveryCharge: parseInt(e.target.value) || 0 })}
                    style={{ width: 120, fontSize: 14, border: '1px solid #DDD', borderRadius: 6, padding: '8px 12px' }}
                    placeholder="Charge amount"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Options Section */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #EEE' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Payment Options</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Choose which payment methods your students can use to subscribe.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* UPI Option */}
              <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 12, border: `1px solid ${(isEditingProfile ? editOwnerData.paymentOptions?.upi : messInfo.paymentOptions?.upi) ? '#F26B2E' : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Online UPI</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>GPay, PhonePe, Paytm, etc.</div>
                    </div>
                  </div>
                  {isEditingProfile ? (
                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                      <input
                        type="checkbox"
                        checked={editOwnerData.paymentOptions?.upi ?? false}
                        onChange={e => setEditOwnerData({ ...editOwnerData, paymentOptions: { ...editOwnerData.paymentOptions, upi: e.target.checked } })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: editOwnerData.paymentOptions?.upi ? '#F26B2E' : '#CBD5E1', transition: '.4s', borderRadius: 34 }}>
                        <span style={{ position: 'absolute', height: 18, width: 18, left: 4, bottom: 4, backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: editOwnerData.paymentOptions?.upi ? 'translateX(24px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                  ) : (
                    <div style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: messInfo.paymentOptions?.upi ? '#DEF7EC' : '#F3F4F6', color: messInfo.paymentOptions?.upi ? '#03543F' : '#4B5563' }}>
                      {messInfo.paymentOptions?.upi ? '● ACTIVE' : '○ DISABLED'}
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Option */}
              <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 12, border: `1px solid ${(isEditingProfile ? editOwnerData.paymentOptions?.cash : messInfo.paymentOptions?.cash) ? '#F26B2E' : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Pay in Cash</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Pay directly at the mess counter.</div>
                    </div>
                  </div>
                  {isEditingProfile ? (
                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                      <input
                        type="checkbox"
                        checked={editOwnerData.paymentOptions?.cash ?? false}
                        onChange={e => setEditOwnerData({ ...editOwnerData, paymentOptions: { ...editOwnerData.paymentOptions, cash: e.target.checked } })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: editOwnerData.paymentOptions?.cash ? '#F26B2E' : '#CBD5E1', transition: '.4s', borderRadius: 34 }}>
                        <span style={{ position: 'absolute', height: 18, width: 18, left: 4, bottom: 4, backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: editOwnerData.paymentOptions?.cash ? 'translateX(24px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                  ) : (
                    <div style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: messInfo.paymentOptions?.cash ? '#DEF7EC' : '#F3F4F6', color: messInfo.paymentOptions?.cash ? '#03543F' : '#4B5563' }}>
                      {messInfo.paymentOptions?.cash ? '● ACTIVE' : '○ DISABLED'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>



        </div>
      </div>

      <div className="owner-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-title-sm">Manage Weekly Menu</h1>
          <p className="table-subtitle">Update your recurring weekly meal plan. Changes here repeat every week.</p>
        </div>
      </div>

      <div className="owner-calendar-card" style={{ padding: '16px' }}>
        <div className="day-selector-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <button 
              key={day} 
              className={`filter-pill ${activeDay === day ? 'active' : ''}`}
              onClick={() => setActiveDay(day)}
              style={{ minWidth: '80px', flexShrink: 0 }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="owner-meal-sections" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {['breakfast', 'lunch', 'dinner'].map(mealType => (
          <div key={mealType} className="owner-meal-card" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="meal-card-header">
              <div className="meal-title-wrap">
                <div className={`meal-dot ${mealType}`}></div>
                <h3 className="meal-name" style={{ textTransform: 'capitalize' }}>{mealType}</h3>
              </div>
            </div>
            <div className="meal-items-list">
              {(menuData[activeDay]?.[mealType] || []).map(item => (
                <div key={item.id} className="meal-item">
                  {editingItem && editingItem.id === item.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', padding: '4px' }}>
                      <input 
                        type="text" 
                        value={editingItem.name} 
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && saveItemEdit()}
                        autoFocus
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #F26B2E', fontSize: '14px', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={saveItemEdit} style={{ padding: '6px', color: '#4CAF50', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✓</button>
                        <button onClick={() => setEditingItem(null)} style={{ padding: '6px', color: '#F44336', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="meal-item-left" onClick={() => handleUpdateItemStatus(mealType, item.id)} style={{ cursor: 'pointer' }}>
                        <div className={`meal-item-dot ${item.status === 'Available' ? 'available' : 'unavailable'}`}></div>
                        <span className={`item-name ${item.status === 'Unavailable' ? 'strikethrough' : ''}`}>{item.name}</span>
                        {item.status === 'Unavailable' && <span className="unavailable-badge">Unavailable</span>}
                      </div>
                      <div className="meal-item-actions">
                        <button className="item-action-btn" onClick={() => handleEditItem(mealType, item)}><Icon name="edit" size={14} /></button>
                        <button className="item-action-btn delete" onClick={() => handleDeleteItem(mealType, item.id)}><Icon name="trash" size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', padding: '0 8px' }}>
                <input 
                  type="text" 
                  placeholder={`Add new ${mealType} item...`}
                  value={newItemInputs[mealType]}
                  onChange={(e) => setNewItemInputs({ ...newItemInputs, [mealType]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(mealType)}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #E0E0E0', 
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => handleAddItem(mealType)}
                  style={{ 
                    padding: '8px 20px', 
                    background: '#F26B2E', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscribers = () => (
    <div className="owner-view">
      <div className="owner-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-title-sm">Subscribers</h1>
          <p className="table-subtitle" style={{ marginTop: 4 }}>View and manage all your active and past subscribers.</p>
        </div>
        <button 
          className="owner-edit-btn" 
          onClick={() => {
            setIsAddUserModalOpen(true);
            fetchStudentsList();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F26B2E', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Icon name="user-plus" size={16} /> Add New User
        </button>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Total Subscribers</div>
            <div className="stat-value">{subscribers.length}</div>
          </div>
          <div className="stat-icon-wrap icon-blue"><Icon name="users" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Active Subscribers</div>
            <div className="stat-value">{subscribers.filter(s => s.status.toLowerCase() === 'active').length}</div>
          </div>
          <div className="stat-icon-wrap icon-orange"><Icon name="users" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Paused Subscribers</div>
            <div className="stat-value">{subscribers.filter(s => s.status.toLowerCase() === 'paused').length}</div>
          </div>
          <div className="stat-icon-wrap icon-yellow"><Icon name="alert-circle" size={20} /></div>
        </div>

        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Expired Subscribers</div>
            <div className="stat-value">{subscribers.filter(s => s.status.toLowerCase() === 'expired').length}</div>
          </div>
          <div className="stat-icon-wrap icon-red"><Icon name="power" size={20} /></div>
        </div>
      </div>

      <div className="owner-toolbar">
        <div className="owner-search-wrap">
          <Icon name="search" size={16} />
          <input type="text" placeholder="Search by name or phone..." />
        </div>
        <div className="owner-filter-dropdown" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Status:</span>
          <div style={{ position: 'relative' }}>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                appearance: 'none',
                padding: '8px 36px 8px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#1E293B',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                minWidth: '130px'
              }}
            >
              <option value="All">All Subscribers</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Expired">Expired</option>
              <option value="Blocked">Blocked</option>
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone number</th>
              <th>Plan</th>
              <th>Start date</th>
              <th>End date</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.filter(s => statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase()).length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No subscribers found for this status.</td></tr>
            ) : subscribers
              .filter(s => statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase())
              .map(sub => (
              <tr key={sub.id}>
                <td>
                  <div style={{ fontWeight: 700, color: '#1A1A1A' }}>{sub.name}</div>
                  <div style={{ fontSize: 11, color: '#7E7E7E' }}>{sub.meals}</div>
                </td>
                <td style={{ fontSize: 13, color: '#4B5563' }}>{sub.phone}</td>
                <td><span className="owner-plan-pill">{sub.plan}</span></td>
                <td style={{ fontSize: 13, color: '#4B5563' }}>{sub.startDate}</td>
                <td style={{ fontSize: 13, color: '#4B5563' }}>{sub.endDate}</td>
                <td>
                  <span className={`owner-status-pill ${sub.status.toLowerCase().replace(' ', '-')}`}>
                    <span className="dot"></span> {sub.status}
                  </span>
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-sm btn-outline-dark" 
                      onClick={() => setSelectedSub(sub)}
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #D1D5DB', 
                        background: '#FFFFFF', 
                        color: '#374151', 
                        fontWeight: '600', 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </button>
                    {sub.status.toLowerCase() === 'paused' && (
                      <button 
                        className="btn-sm btn-success" 
                        onClick={() => handleUpdateSubscriberStatus(sub.id, 'ACTIVE')}
                        style={{
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          border: 'none', 
                          background: '#10B981', 
                          color: '#FFFFFF', 
                          fontWeight: '600', 
                          fontSize: '12px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#10B981'; }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Resume
                      </button>
                    )}
                    <button 
                      className="btn-sm btn-outline-danger" 
                      onClick={() => handleDeleteSubscriber(sub.userId)}
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #FFCDD2', 
                        background: '#FFF5F5', 
                        color: '#D32F2F', 
                        fontWeight: '600', 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FFEBEE'; e.currentTarget.style.borderColor = '#EF9A9A'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#FFCDD2'; }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => {
    return (
      <div className="owner-view">
        <div className="owner-header-row">
          <div>
            <h1 className="admin-title-sm">Payments & Earnings</h1>
            <p className="table-subtitle">Track your income and monitor all transactions.</p>
          </div>
        </div>

        <div className="admin-stats-grid">
          <div className="admin-stat-box">
            <div className="stat-label">Today</div>
            <div className="stat-value">₹0</div>
            <div className="owner-stat-subtext" style={{ marginTop: 12 }}>0 transactions today</div>
          </div>
          <div className="admin-stat-box">
            <div className="stat-label">This week</div>
            <div className="stat-value">₹0</div>
            <div className="owner-stat-subtext" style={{ marginTop: 12 }}>0 transactions</div>
          </div>
          <div className="admin-stat-box">
            <div className="stat-label">This month</div>
            <div className="stat-value">₹0</div>
            <div className="owner-stat-subtext" style={{ marginTop: 12 }}>0 transactions</div>
          </div>
        </div>

        <div className="owner-section-title">
          <h2>Transactions</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="owner-select">
              <option>Last 30 days</option>
            </select>
            <button className="owner-export-btn">
              <Icon name="download" size={14} /> Export
            </button>
          </div>
        </div>

        <div className="admin-table-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>
                  No transactions found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAddUserModal = () => {
    if (!isAddUserModalOpen) return null;

    const handleAddUserSubmit = async (e) => {
      e.preventDefault();
      
      if (!newSubData.name.trim()) {
        alert('Please enter student name.');
        return;
      }
      if (!newSubData.email.trim()) {
        alert('Please enter student email.');
        return;
      }
      if (!newSubData.password.trim()) {
        alert('Please enter student password.');
        return;
      }
      if (!newSubData.address.trim()) {
        alert('Please enter student physical address.');
        return;
      }
      
      // Clean and normalize the phone number
      let cleanedPhone = newSubData.phone.replace(/[\s-()]/g, '');
      if (cleanedPhone.startsWith('+91')) {
        cleanedPhone = cleanedPhone.substring(3);
      } else if (cleanedPhone.startsWith('91') && cleanedPhone.length > 10) {
        cleanedPhone = cleanedPhone.substring(2);
      }
      if (cleanedPhone.length !== 10 || !/^\d+$/.test(cleanedPhone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
      }
      const formattedPhone = `+91 ${cleanedPhone.substring(0, 5)} ${cleanedPhone.substring(5)}`;
      
      const userEmail = newSubData.email.trim().toLowerCase();
      
      // Select meals validation
      const mealsList = [];
      if (newSubData.selectedMeals.breakfast) mealsList.push('Breakfast');
      if (newSubData.selectedMeals.lunch.selected) {
        mealsList.push(`Lunch (${newSubData.selectedMeals.lunch.type})`);
      }
      if (newSubData.selectedMeals.dinner.selected) {
        mealsList.push(`Dinner (${newSubData.selectedMeals.dinner.type})`);
      }
      if (mealsList.length === 0) {
        alert('Please select at least one meal.');
        return;
      }
      const formattedMeals = mealsList.join(', ');

      let userId = null;
      try {
        // Fetch all users to see if student already exists
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users');
        if (usersResponse.data.status === 'success') {
          const existingUser = usersResponse.data.users.find(u => u.email.toLowerCase() === userEmail);
          if (existingUser) {
            userId = existingUser.id;
          }
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
      }

      // If user does not exist, register them
      if (!userId) {
        // Enforce same password requirements as signup
        const hasLength = newSubData.password.length >= 8;
        const hasUppercase = /[A-Z]/.test(newSubData.password);
        const hasNumber = /[0-9]/.test(newSubData.password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(newSubData.password);

        if (!hasLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
          alert('Password must contain at least 8 characters, one uppercase letter, one number, and one special character.');
          return;
        }

        try {
          const signupRes = await axios.post('http://localhost:5000/api/signup', {
            name: newSubData.name.trim(),
            email: userEmail,
            phone: formattedPhone,
            role: 'student',
            address: newSubData.address.trim(),
            password: newSubData.password
          });
          
          if (signupRes.data.status === 'success') {
            userId = signupRes.data.user.id;
          } else {
            alert('Failed to register student.');
            return;
          }
        } catch (err) {
          console.error('Error auto-registering student:', err);
          alert(err.response?.data?.message || 'Failed to create student account.');
          return;
        }
      }

      // Expiry calculation
      let days = 30;
      if (newSubData.plan_duration === 'Trial (15 Days)') days = 15;
      else if (newSubData.plan_duration === '3 Months') days = 90;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      const expiryDateStr = expiryDate.toISOString().split('T')[0];

      try {
        const response = await axios.post('http://localhost:5000/api/subscriptions', {
          user_id: userId,
          user_name: newSubData.name.trim(),
          user_phone: formattedPhone,
          user_email: userEmail,
          mess_name: messInfo.name,
          plan_duration: newSubData.plan_duration,
          meals: formattedMeals,
          delivery_type: newSubData.homeDelivery ? 'Home Delivery' : 'Dine-in',
          total_amount: parseFloat(newSubData.total_amount),
          payment_method: newSubData.payment_method,
          expiry_date: expiryDateStr
        });

        if (response.data.status === 'success') {
          alert('Subscriber added and subscribed successfully!');
          setIsAddUserModalOpen(false);
          setNewSubData({
            name: '',
            email: '',
            phone: '+91 ',
            address: '',
            password: '',
            selectedMeals: {
              breakfast: true,
              lunch: { selected: true, type: 'Veg' },
              dinner: { selected: false, type: 'Veg' }
            },
            plan_duration: '1 Month',
            homeDelivery: false,
            payment_method: 'Cash',
            total_amount: '0'
          });
          fetchSubscribers();
        }
      } catch (error) {
        console.error('Error adding subscriber:', error);
        alert(error.response?.data?.message || 'Failed to add subscriber.');
      }
    };

    return (
      <div className="admin-modal-overlay" onClick={closeAddSubModal}>
        <div className="admin-modal-content" style={{ maxWidth: 840, width: '90%' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Add New Subscriber</h2>
              <div className="modal-subtitle">Directly register a student and subscribe them to your plans</div>
            </div>
            <button className="modal-close-btn" onClick={closeAddSubModal}>✕</button>
          </div>
          <form onSubmit={handleAddUserSubmit} className="modal-body-scroll" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              {/* Left Column: Student Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', borderBottom: '1px solid #EEE', paddingBottom: '8px', color: '#1A1A1A' }}>Student Details</h3>
                
                <div>
                  <label className="info-label">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter student's full name" 
                    className="edit-input" 
                    value={newSubData.name} 
                    onChange={e => setNewSubData({...newSubData, name: e.target.value})} 
                    style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 8, border: '1px solid #DDD' }} 
                  />
                </div>

                <div>
                  <label className="info-label">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter student's email" 
                    className="edit-input" 
                    value={newSubData.email} 
                    onChange={e => setNewSubData({...newSubData, email: e.target.value})} 
                    style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 8, border: '1px solid #DDD' }} 
                  />
                </div>

                <div>
                  <label className="info-label">Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+91 " 
                    className="edit-input" 
                    value={newSubData.phone} 
                    onChange={e => setNewSubData({...newSubData, phone: e.target.value})} 
                    style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 8, border: '1px solid #DDD' }} 
                  />
                </div>

                <div>
                  <label className="info-label">Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showSubPassword ? "text" : "password"} 
                      required 
                      placeholder="Enter student's login password" 
                      className="edit-input" 
                      value={newSubData.password} 
                      onChange={e => setNewSubData({...newSubData, password: e.target.value})} 
                      style={{ width: '100%', marginTop: 4, padding: '10px 40px 10px 14px', borderRadius: 8, border: '1px solid #DDD' }} 
                    />
                    <div 
                      onClick={() => setShowSubPassword(!showSubPassword)} 
                      className="eye-icon"
                      style={{ top: 'calc(50% + 2px)', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        {showSubPassword && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />}
                      </svg>
                    </div>
                  </div>
                  
                  {/* Password Requirements Checklist */}
                  <div style={{ marginTop: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password must contain:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: '8+ Characters', met: newSubData.password.length >= 8 },
                        { label: 'One Uppercase', met: /[A-Z]/.test(newSubData.password) },
                        { label: 'One Number', met: /[0-9]/.test(newSubData.password) },
                        { label: 'Special Char', met: /[^A-Za-z0-9]/.test(newSubData.password) }
                      ].map((req, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: req.met ? '#10B981' : '#94A3B8', transition: '0.2s color' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            {req.met ? <polyline points="20 6 9 17 4 12"></polyline> : <circle cx="12" cy="12" r="10"></circle>}
                          </svg>
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="info-label">Physical Address</label>
                  <textarea 
                    required
                    placeholder="Enter student's address (e.g., Hostel Block / Room No.)" 
                    className="edit-input" 
                    value={newSubData.address} 
                    onChange={e => setNewSubData({...newSubData, address: e.target.value})} 
                    style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 8, border: '1px solid #DDD', height: '100px', resize: 'none', fontFamily: 'inherit' }} 
                  />
                </div>
              </div>

              {/* Right Column: Plan Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', borderBottom: '1px solid #EEE', paddingBottom: '8px', color: '#1A1A1A' }}>Subscription Details</h3>
                
                {/* Meal Select (like in user page mess detail) */}
                <div>
                  <label className="info-label" style={{ marginBottom: '8px', display: 'block' }}>Select Meals (Up to 3)</label>
                  
                  {/* Breakfast Box */}
                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                    backgroundColor: newSubData.selectedMeals.breakfast ? '#FFF5EE' : 'white',
                    borderColor: newSubData.selectedMeals.breakfast ? '#F26B2E' : '#E2E8F0',
                    marginBottom: '8px', cursor: 'pointer'
                  }} onClick={() => setNewSubData({
                    ...newSubData, 
                    selectedMeals: { ...newSubData.selectedMeals, breakfast: !newSubData.selectedMeals.breakfast }
                  })}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newSubData.selectedMeals.breakfast} readOnly style={{ marginRight: '8px', accentColor: 'var(--orange)' }} /> Breakfast
                    </label>
                    <span style={{ color: '#F26B2E', fontSize: '12px', fontWeight: '600' }}>₹{messInfo.pricing?.breakfast}/day</span>
                  </div>

                  {/* Lunch Box */}
                  <div style={{ 
                    padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                    backgroundColor: newSubData.selectedMeals.lunch.selected ? '#FFF5EE' : 'white',
                    borderColor: newSubData.selectedMeals.lunch.selected ? '#F26B2E' : '#E2E8F0',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNewSubData({
                      ...newSubData, 
                      selectedMeals: { ...newSubData.selectedMeals, lunch: { ...newSubData.selectedMeals.lunch, selected: !newSubData.selectedMeals.lunch.selected } }
                    })}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                        <input type="checkbox" checked={newSubData.selectedMeals.lunch.selected} readOnly style={{ marginRight: '8px', accentColor: 'var(--orange)' }} /> Lunch
                      </label>
                      <span style={{ color: '#F26B2E', fontSize: '12px', fontWeight: '600' }}>
                        ₹{newSubData.selectedMeals.lunch.type === 'Non-Veg' ? messInfo.pricing?.lunchNonVeg : messInfo.pricing?.lunchVeg}/day
                      </span>
                    </div>
                    {newSubData.selectedMeals.lunch.selected && messInfo.tag === 'Veg & Non-Veg' && (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingLeft: '22px' }}>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          <input type="radio" name="modalLunchType" checked={newSubData.selectedMeals.lunch.type === 'Veg'} onChange={() => setNewSubData({
                            ...newSubData,
                            selectedMeals: { ...newSubData.selectedMeals, lunch: { ...newSubData.selectedMeals.lunch, type: 'Veg' } }
                          })} /> Veg
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          <input type="radio" name="modalLunchType" checked={newSubData.selectedMeals.lunch.type === 'Non-Veg'} onChange={() => setNewSubData({
                            ...newSubData,
                            selectedMeals: { ...newSubData.selectedMeals, lunch: { ...newSubData.selectedMeals.lunch, type: 'Non-Veg' } }
                          })} /> Non-Veg
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Dinner Box */}
                  <div style={{ 
                    padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                    backgroundColor: newSubData.selectedMeals.dinner.selected ? '#FFF5EE' : 'white',
                    borderColor: newSubData.selectedMeals.dinner.selected ? '#F26B2E' : '#E2E8F0',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNewSubData({
                      ...newSubData, 
                      selectedMeals: { ...newSubData.selectedMeals, dinner: { ...newSubData.selectedMeals.dinner, selected: !newSubData.selectedMeals.dinner.selected } }
                    })}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                        <input type="checkbox" checked={newSubData.selectedMeals.dinner.selected} readOnly style={{ marginRight: '8px', accentColor: 'var(--orange)' }} /> Dinner
                      </label>
                      <span style={{ color: '#F26B2E', fontSize: '12px', fontWeight: '600' }}>
                        ₹{newSubData.selectedMeals.dinner.type === 'Non-Veg' ? messInfo.pricing?.dinnerNonVeg : messInfo.pricing?.dinnerVeg}/day
                      </span>
                    </div>
                    {newSubData.selectedMeals.dinner.selected && messInfo.tag === 'Veg & Non-Veg' && (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingLeft: '22px' }}>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          <input type="radio" name="modalDinnerType" checked={newSubData.selectedMeals.dinner.type === 'Veg'} onChange={() => setNewSubData({
                            ...newSubData,
                            selectedMeals: { ...newSubData.selectedMeals, dinner: { ...newSubData.selectedMeals.dinner, type: 'Veg' } }
                          })} /> Veg
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                          <input type="radio" name="modalDinnerType" checked={newSubData.selectedMeals.dinner.type === 'Non-Veg'} onChange={() => setNewSubData({
                            ...newSubData,
                            selectedMeals: { ...newSubData.selectedMeals, dinner: { ...newSubData.selectedMeals.dinner, type: 'Non-Veg' } }
                          })} /> Non-Veg
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration select */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="info-label">Duration</label>
                    <select 
                      className="edit-input" 
                      value={newSubData.plan_duration} 
                      onChange={e => setNewSubData({...newSubData, plan_duration: e.target.value})} 
                      style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', backgroundColor: 'white' }}
                    >
                      <option>Trial (15 Days)</option>
                      <option>1 Month</option>
                      <option>3 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="info-label">Payment Method</label>
                    <select 
                      className="edit-input" 
                      value={newSubData.payment_method} 
                      onChange={e => setNewSubData({...newSubData, payment_method: e.target.value})} 
                      style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD', backgroundColor: 'white' }}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                    </select>
                  </div>
                </div>

                {/* Home Delivery check */}
                {messInfo.homeDelivery && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#1E293B' }}>
                      <input 
                        type="checkbox" 
                        checked={newSubData.homeDelivery} 
                        onChange={e => setNewSubData({...newSubData, homeDelivery: e.target.checked})} 
                        style={{ marginRight: '10px', accentColor: 'var(--orange)' }} 
                      />
                      Enable Home Delivery
                    </label>
                    <span style={{ color: '#F26B2E', fontSize: '13px', fontWeight: '700' }}>+₹{messInfo.deliveryCharge}</span>
                  </div>
                )}

                {/* Pricing Summary */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                    <span>Plan Duration</span>
                    <span style={{ fontWeight: '600', color: '#1E293B' }}>{newSubData.plan_duration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#1E293B', borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                    <span>TOTAL AMOUNT</span>
                    <span style={{ color: '#F26B2E', fontSize: '16px' }}>₹{newSubData.total_amount}</span>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #EEE', paddingTop: '20px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline-dark btn-sm" style={{ padding: '10px 24px' }} onClick={closeAddSubModal}>Cancel</button>
              <button type="submit" className="btn-primary-sm" style={{ padding: '10px 32px', background: '#F26B2E', color: 'white', border: 'none', fontWeight: '700' }}>Add Subscriber</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSubscriberDetailsModal = () => {
    if (!selectedSub) return null;

    return (
      <div className="admin-modal-overlay" onClick={() => setSelectedSub(null)}>
        <div className="admin-modal-content" style={{ maxWidth: 580, width: '90%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="modal-title" style={{ color: 'white', fontSize: '20px', fontWeight: '800' }}>Subscriber Details</h2>
              <div className="modal-subtitle" style={{ color: '#E0E0E0', fontSize: '12px' }}>Full profile and subscription info</div>
            </div>
            <button className="modal-close-btn" style={{ color: 'white', opacity: 0.8 }} onClick={() => setSelectedSub(null)}>✕</button>
          </div>
          
          <div style={{ padding: '32px', background: '#FCFDFE', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
            
            {/* Profile Avatar Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F26B2E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '22px' }}>
                {selectedSub.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>{selectedSub.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`owner-status-pill ${selectedSub.status.toLowerCase().replace(' ', '-')}`} style={{ margin: 0 }}>
                    <span className="dot"></span> {selectedSub.status}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px' }}>
                    ID: #{selectedSub.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Details Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px', wordBreak: 'break-all' }}>{selectedSub.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>{selectedSub.phone}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Physical Address</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '4px', lineHeight: '1.5', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {selectedSub.address}
                </div>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #CBD5E1', margin: 0 }} />

            {/* Plan and Meals Box */}
            <div style={{ background: '#FFF5F0', borderRadius: '16px', border: '1px solid #FFE4D6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscription Details</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9A3412', textTransform: 'uppercase', opacity: 0.8 }}>Current Plan</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#7C2D12', marginTop: '4px' }}>{selectedSub.plan}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9A3412', textTransform: 'uppercase', opacity: 0.8 }}>Delivery Service</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#7C2D12', marginTop: '4px' }}>{selectedSub.deliveryType}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9A3412', textTransform: 'uppercase', opacity: 0.8 }}>Selected Meals</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#7C2D12', marginTop: '4px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FFD0B8', display: 'inline-block' }}>
                    {selectedSub.meals}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing and Dates Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>START DATE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>{selectedSub.startDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>EXPIRY DATE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>{selectedSub.endDate}</div>
              </div>
              
              {selectedSub.status === 'PAUSED' && selectedSub.pauseStartDate && (
                <div style={{ gridColumn: 'span 2', background: '#FFFDF0', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FEF08A', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#854D0E' }}>
                  <span>PAUSED FROM: {selectedSub.pauseStartDate}</span>
                  <span>TO: {selectedSub.pauseEndDate}</span>
                </div>
              )}

              <div style={{ borderTop: '1px dashed #E2E8F0', gridColumn: 'span 2', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>PAYMENT METHOD</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>{selectedSub.paymentMethod}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>TOTAL PAID</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#F26B2E', marginTop: '2px' }}>₹{selectedSub.amount}</div>
                </div>
              </div>
            </div>

          </div>
          
          <div style={{ padding: '20px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline-dark btn-sm" style={{ padding: '10px 28px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setSelectedSub(null)}>
              Close Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#F26B2E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'black' }}>GS</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>GrubSpot</div>
            <div style={{ fontSize: 11, color: '#7E7E7E', marginTop: 4, fontWeight: 600 }}>{messInfo.name}</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon"><Icon name={item.icon} /></span>
              <span className="admin-nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-box" onClick={() => setActiveTab('Profile')} style={{ background: activeTab === 'Profile' ? '#FFF0E6' : 'transparent', borderRadius: '10px', cursor: 'pointer' }}>
             <div className="admin-avatar">{messInfo.initials}</div>
             <div>
               <div className="admin-username">{messInfo.owner}</div>
               <div className="admin-role">Mess Owner</div>
             </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
             <span className="admin-nav-icon"><Icon name="power" /></span>
             <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
         {activeTab === 'Overview' && renderOverview()}
         {activeTab === 'Profile' && renderProfile()}
         {activeTab === 'Manage Mess' && renderManageMenu()}
         {activeTab === 'Subscribers' && renderSubscribers()}
         {activeTab === 'Payments & Earnings' && renderPayments()}
         {activeTab === 'Feedback' && renderFeedback()}
         {renderAddUserModal()}
         {renderSubscriberDetailsModal()}
      </main>
    </div>
  );
}

export default OwnerPanel;
