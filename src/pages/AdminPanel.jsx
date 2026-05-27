import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css'; 

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedMess, setSelectedMess] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('Overview');
  const [messSearch, setMessSearch] = useState('');
  const [messStatusFilter, setMessStatusFilter] = useState('All');

  // Navigation Items
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'Mess Management', label: 'Mess Management', icon: 'utensils' },
    { id: 'User Management', label: 'User Management', icon: 'users' },
    { id: 'Financials', label: 'Financials', icon: 'dollar-sign' },
    { id: 'Feedback/Tickets', label: 'Feedback/Tickets', icon: 'message-square' },
  ];

  // Real Data from Backend
  const [messesList, setMessesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [selectedMessReviews, setSelectedMessReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMess) {
      fetchMessReviews(selectedMess.name);
    } else {
      setSelectedMessReviews([]);
    }
  }, [selectedMess]);

  const fetchMessReviews = async (messName) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/reviews/mess/${encodeURIComponent(messName)}`);
      if (res.data.status === 'success') {
        setSelectedMessReviews(res.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching mess reviews:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [messesRes, usersRes, ticketsRes, subsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/messes'),
        axios.get('http://localhost:5000/api/admin/users'),
        axios.get('http://localhost:5000/api/admin/tickets'),
        axios.get('http://localhost:5000/api/admin/subscriptions')
      ]);

      if (messesRes.data && messesRes.data.status === 'success' && Array.isArray(messesRes.data.messes)) {
        setMessesList(messesRes.data.messes.map(m => ({
          id: m.id,
          name: m.mess_name,
          owner: m.owner_name,
          location: m.address,
          status: m.mess_status || m.user_status,
          users: m.total_subscribers || 0, 
          phone: m.phone,
          email: m.email,
          joined: m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A',
          rawJoined: m.created_at, // Keep raw timestamp
          rating: m.avg_rating ? parseFloat(m.avg_rating).toFixed(1) : "0.0",
          complaints: 0
        })));
      }

      if (usersRes.data && usersRes.data.status === 'success' && Array.isArray(usersRes.data.users)) {
        setUsersList(usersRes.data.users.map(u => ({
          id: u.id,
          initials: u.name ? u.name.split(' ').map(n => n[0]).join('') : '??',
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role === 'mess_owner' ? 'Mess Owner' : u.role === 'admin' ? 'Admin' : 'Student',
          status: u.status,
          joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A',
          rawJoined: u.created_at // Keep raw timestamp for calculation
        })));
      }

      if (ticketsRes.data && ticketsRes.data.status === 'success' && Array.isArray(ticketsRes.data.tickets)) {
        const rawTickets = ticketsRes.data.tickets;
        setTicketsList(rawTickets.map(t => ({
          id: t.ticket_id,
          user: t.user_name,
          mess: t.mess_name,
          category: t.category,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          date: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : 'N/A'
        })));

        // Update complaints count in messesList
        setMessesList(prev => prev.map(m => ({
          ...m,
          complaints: rawTickets.filter(t => t.mess_name === m.name).length
        })));
      }

      if (subsRes.data && subsRes.data.status === 'success' && Array.isArray(subsRes.data.subscriptions)) {
        setSubscriptionsList(subsRes.data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isAddMessModalOpen, setIsAddMessModalOpen] = useState(false);
  const [showMessPassword, setShowMessPassword] = useState(false);
  const [newMessData, setNewMessData] = useState({ 
    name: '', 
    owner: '', 
    location: '', 
    phone: '+91 ', 
    email: '',
    password: '',
    googleMapUrl: ''
  });

  const handleToggleMessStatus = async (messId, newStatus) => {
    try {
      await axios.post('http://localhost:5000/api/admin/update-status', { id: messId, status: newStatus });
      setMessesList(prev => prev.map(m => m.id === messId ? { ...m, status: newStatus } : m));
      if (selectedMess && selectedMess.id === messId) {
        setSelectedMess(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const handleAddMess = async (e) => {
    e.preventDefault();

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMessData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Strip optional +91 or 91 country code to validate a 10-digit base number
    let basePhone = newMessData.phone.replace(/\s+/g, '');
    if (basePhone.startsWith('+91')) {
      basePhone = basePhone.substring(3);
    } else if (basePhone.startsWith('91') && basePhone.length > 10) {
      basePhone = basePhone.substring(2);
    }
    basePhone = basePhone.replace(/\D/g, ''); // Remove non-digits

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(basePhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    const cleanPhone = `+91 ${basePhone}`;

    try {
      const response = await fetch('http://localhost:5000/api/admin/add-mess-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMessData.owner,
          email: newMessData.email,
          password: newMessData.password,
          phone: cleanPhone,
          mess_name: newMessData.name,
          address: newMessData.location,
          googleMapUrl: newMessData.googleMapUrl
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const newMess = {
          id: data.user.id,
          name: data.user.mess_name,
          owner: data.user.name,
          location: data.user.address,
          phone: data.user.phone,
          email: data.user.email,
          status: 'Active',
          users: 0,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          rawJoined: new Date().toISOString(),
          rating: 0.0,
          complaints: 0
        }; 
        setMessesList([newMess, ...messesList]);
        
        // Also add to users list
        const newUser = {
          id: data.user.id,
          initials: data.user.name.split(' ').map(n => n[0]).join(''),
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          role: 'Mess Owner',
          status: 'Active',
          joined: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          rawJoined: new Date().toISOString()
        };
        setUsersList([newUser, ...usersList]);

        setIsAddMessModalOpen(false);
        setShowMessPassword(false);
        setNewMessData({ name: '', owner: '', location: '', phone: '+91 ', email: '', password: '', googleMapUrl: '' });
        alert('Mess Owner and Mess registered successfully!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding mess owner:', error);
      alert('Failed to register mess owner. Error: ' + error.message);
    }
  };


  const handleToggleUserStatus = async (userId) => {
    const user = usersList.find(u => u.id === userId);
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    try {
      await axios.post('http://localhost:5000/api/admin/update-status', { id: userId, status: newStatus });
      setUsersList(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user permanently? This will also remove all their associated subscriptions, tickets, and messes.')) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setMessesList(prev => prev.filter(m => m.id !== userId));
      setSelectedMess(null);
      setSelectedUser(null);
      alert('User and all associated data deleted successfully.');
    } catch (error) {
      alert('Error deleting user: ' + (error.response?.data?.message || error.message));
    }
  };


  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.post('http://localhost:5000/api/admin/update-ticket-status', { ticket_id: ticketId, status: newStatus });
      setTicketsList(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('Error updating ticket: ' + error.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };


  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  // Feedback/Tickets State
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Financials State ──────────────────────────────────────────────────
  const [finSearch, setFinSearch] = useState('');
  const [finDateFilter, setFinDateFilter] = useState('All');
  const [finMessFilter, setFinMessFilter] = useState('All');
  const [finStatusFilter, setFinStatusFilter] = useState('All');
  const [selectedTx, setSelectedTx] = useState(null);



  const mockTransactions = [];

  const revenueData = [];
  const paymentBreakdown = [];

  const getStatusPill = (status) => {
    switch (status) {
      case 'Active': return <span className="status-pill active-pill">Active</span>;
      case 'Inactive': return <span className="status-pill inactive-pill">Inactive</span>;
      case 'Blocked': return <span className="status-pill blocked-pill">Blocked</span>;
      default: return null;
    }
  };

  const getRolePill = (role) => {
    if (role === 'Mess Owner') return <span className="role-pill owner-pill">Mess Owner</span>;
    if (role === 'Admin') return <span className="role-pill admin-pill" style={{ background: '#E3F2FD', color: '#1976D2' }}>Admin</span>;
    return <span className="role-pill student-pill">Student</span>;
  };

  // SVGs for Icons
  const Icon = ({ name, size = 18 }) => {
    const svgs = {
      'grid': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
      'utensils': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>,
      'users': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      'dollar-sign': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
      'message-square': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
      'settings': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
      'trending-up': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
      'file-text': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      'alert-circle': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
      'check-circle': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
      'x-circle': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
      'star': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
      'eye': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
      'power': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>,
      'user': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
      'x': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    };
    return svgs[name] || null;
  };

  // Views
  const recentActivity = useMemo(() => {
    // Sort combined users and messes by ID/Time (approximation for now)
    const combined = [
      ...usersList.map(u => ({ ...u, type: 'user' })),
      ...messesList.map(m => ({ ...m, type: 'mess' }))
    ].sort((a, b) => b.id - a.id).slice(0, 5);

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return combined.map(item => {
      const timeVal = formatDateTime(item.rawJoined);
      if (item.type === 'user') {
        return { 
          icon: 'users', 
          color: '#1976D2', 
          bg: '#E3F2FD', 
          text: `New ${item.role} registered: ${item.name}`, 
          time: timeVal 
        };
      } else {
        return { 
          icon: 'utensils', 
          color: '#F26B2E', 
          bg: '#FFF0E6', 
          text: `New Mess: ${item.name} (${item.owner})`, 
          time: timeVal 
        };
      }
    });
  }, [usersList, messesList]);
  const newRegistrationsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return usersList.filter(u => {
      if (!u.rawJoined) return false;
      return new Date(u.rawJoined) >= sevenDaysAgo;
    }).length;
  }, [usersList]);

  const quickActions = [
    { icon: 'utensils', label: 'Add New Mess', color: '#F26B2E', bg: '#FFF0E6', tab: 'Mess Management' },
    { icon: 'users', label: 'Manage Users', color: '#1976D2', bg: '#E3F2FD', tab: 'User Management' },
    { icon: 'dollar-sign', label: 'View Financials', color: '#9C27B0', bg: '#F3E5F5', tab: 'Financials' },
    { icon: 'message-square', label: 'Open Tickets', color: '#FF9800', bg: '#FFF3E0', tab: 'Feedback/Tickets' },
  ];

  const renderDashboard = () => (
    <div className="admin-view">
      {/* Greeting Banner */}
      <div className="admin-header-box">
        <h1 className="admin-title">Good morning, Admin! 👋</h1>
        <p className="admin-subtitle">Here is a live snapshot of how Mess Finder is performing today.</p>
        <div className="admin-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>

      {/* KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-box-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="stat-label">Total Messes</div>
            <div className="stat-value">{messesList.length}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#9E9E9E' }}>
              {messesList.filter(m => m.status === 'Active').length} active · {messesList.filter(m => m.status === 'Blocked').length} blocked · {messesList.filter(m => m.status === 'Pending').length} pending
            </div>
          </div>
          <div className="stat-icon-wrap icon-orange"><Icon name="utensils" /></div>
        </div>
        <div className="admin-stat-box-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{usersList.length}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#9E9E9E' }}>
              {usersList.filter(u => u.role === 'Student').length} Students · {usersList.filter(u => u.role === 'Mess Owner').length} Owners
            </div>
          </div>
          <div className="stat-icon-wrap icon-green"><Icon name="users" /></div>
        </div>
        <div className="admin-stat-box-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {messesList.filter(m => m.status === 'Pending').length > 0 && (
              <span style={{ fontSize: 11, color: '#9C27B0', fontWeight: 700, background: '#F3E5F5', padding: '4px 8px', borderRadius: 12, marginBottom: 8, display: 'inline-block' }}>
                Action needed
              </span>
            )}
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{messesList.filter(m => m.status === 'Pending').length}</div>
            <button className="btn-stat-action" style={{ background: '#9C27B0', marginTop: 10, width: 'auto', padding: '6px 16px' }} onClick={() => setActiveTab('Mess Management')}>Review Now</button>
          </div>
          <div className="stat-icon-wrap icon-purple"><Icon name="file-text" /></div>
        </div>
        <div className="admin-stat-box-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {ticketsList.filter(t => t.status === 'Open').length > 0 && (
              <span style={{ fontSize: 11, color: '#FF9800', fontWeight: 700, background: '#FFF3E0', padding: '4px 8px', borderRadius: 12, marginBottom: 8, display: 'inline-block' }}>
                {ticketsList.filter(t => t.status === 'Open').length} Open
              </span>
            )}
            <div className="stat-label">Support Tickets</div>
            <div className="stat-value">{ticketsList.length}</div>
            <button className="btn-stat-action" style={{ marginTop: 10, width: 'auto', padding: '6px 16px' }} onClick={() => setActiveTab('Feedback/Tickets')}>Resolve Now</button>
          </div>
          <div className="stat-icon-wrap icon-peach"><Icon name="message-square" /></div>
        </div>
      </div>

      {/* Bottom two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginTop: 24 }}>

        {/* Pending Approvals Table */}
        <div className="admin-table-panel">
          <div className="table-panel-header">
            <div>
              <h2 className="table-title">Pending Mess Approvals</h2>
              <p className="table-subtitle">Messes awaiting admin review</p>
            </div>
            <span className="badge-blue">{messesList.filter(m => m.status === 'Pending').length} Pending</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mess Name</th>
                <th>Owner</th>
                <th>Location</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messesList.filter(m => m.status === 'Pending').length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>No pending approvals</td></tr>
              ) : messesList.filter(m => m.status === 'Pending').map((m, i) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}><Icon name="utensils" size={13}/> <span style={{ marginLeft: 6 }}>{m.name}</span></td>
                  <td style={{ color: '#7E7E7E', fontSize: 13 }}>{m.owner}</td>
                  <td style={{ color: '#9E9E9E', fontSize: 12 }}>{m.location}</td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn-sm btn-success" onClick={() => handleToggleMessStatus(m.id, 'Active')}>Approve</button>
                      <button className="btn-sm btn-danger" onClick={() => handleToggleMessStatus(m.id, 'Blocked')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column: Quick Actions + Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Actions */}
          <div className="admin-table-panel" style={{ padding: 20 }}>
            <h2 className="table-title" style={{ marginBottom: 4 }}>Quick Actions</h2>
            <p className="table-subtitle" style={{ marginBottom: 16 }}>Jump to key sections</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map(a => (
                <button key={a.label} className="dash-quick-action-btn" style={{ '--qa-color': a.color, '--qa-bg': a.bg }} onClick={() => setActiveTab(a.tab)}>
                  <span className="qa-icon-wrap"><Icon name={a.icon} size={16} /></span>
                  <span className="qa-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-table-panel" style={{ padding: 20, flex: 1 }}>
            <h2 className="table-title" style={{ marginBottom: 4 }}>Recent Activity</h2>
            <p className="table-subtitle" style={{ marginBottom: 16 }}>Latest events across the platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={a.icon} size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: '#9E9E9E', marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderMessManagement = () => {
    const filtered = messesList.filter(m => {
      const q = messSearch.toLowerCase();
      const matchQ = !q || m.name.toLowerCase().includes(q) || m.owner.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
      const matchStatus = messStatusFilter === 'All' || m.status === messStatusFilter;
      return matchQ && matchStatus;
    });
    return (
    <div className="admin-view">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title-sm">Mess Management</h1>
          <p className="table-subtitle" style={{ marginTop: 4 }}>Manage and monitor all registered messes on the platform.</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setIsAddMessModalOpen(true)}>+ Add New Mess</button>
      </div>

      <div className="admin-stats-grid" style={{ marginTop: 24 }}>
        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Total Messes</div>
            <div className="stat-value">{messesList.length}</div>
          </div>
          <div className="stat-icon-wrap icon-orange"><Icon name="utensils" /></div>
        </div>
        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Active Messes</div>
            <div className="stat-value">{messesList.filter(m => m.status === 'Active').length}</div>
          </div>
          <div className="stat-icon-wrap icon-green"><Icon name="check-circle" /></div>
        </div>
        <div className="admin-stat-box-sm">
          <div>
            <div className="stat-label">Blocked Messes</div>
            <div className="stat-value">{messesList.filter(m => m.status === 'Blocked').length}</div>
          </div>
          <div className="stat-icon-wrap icon-red"><Icon name="x-circle" /></div>
        </div>
      </div>

      <div className="admin-table-panel">
        <div className="table-panel-header" style={{ borderBottom: 'none' }}>
          <div>
            <h2 className="table-title">All Registered Messes</h2>
            <p className="table-subtitle">Showing {filtered.length} of {messesList.length} messes</p>
          </div>
          <span className="badge-blue">{messesList.filter(m => m.status === 'Active').length} Active</span>
        </div>
        <div className="table-toolbar">
          <div className="search-input-wrap" style={{ width: 300 }}>
            <span style={{ opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, owner, or location..."
              value={messSearch}
              onChange={e => setMessSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={messStatusFilter} onChange={e => setMessStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Blocked</option>
          </select>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mess Name</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Users</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No messes match your search.</td></tr>
            ) : filtered.map(mess => (
              <tr key={mess.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="mess-avatar-chip"><Icon name="utensils" size={13} /></div>
                    <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{mess.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: '#555' }}>{mess.owner}</td>
                <td style={{ color: '#9E9E9E', fontSize: 12 }}>{mess.location}</td>
                <td>
                  <span style={{ fontWeight: 700, fontSize: 13, color: mess.rating >= 4.5 ? '#388E3C' : mess.rating >= 3.5 ? '#E65100' : '#C62828' }}>
                    {mess.rating}
                  </span>
                </td>
                <td>{getStatusPill(mess.status)}</td>
                <td style={{ color: '#7E7E7E', fontSize: 13 }}>
                  {mess.users}
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn-sm btn-outline-dark" onClick={() => setSelectedMess(mess)}>
                      <Icon name="eye" size={13}/> View
                    </button>
                    {mess.status !== 'Active' && (
                      <button className="btn-sm btn-success" onClick={() => handleToggleMessStatus(mess.id, 'Active')}>
                        {mess.status === 'Blocked' ? 'Unblock' : 'Approve'}
                      </button>
                    )}

                    {mess.status !== 'Blocked' && (
                      <button className="btn-sm btn-danger" onClick={() => handleToggleMessStatus(mess.id, 'Blocked')}>Block</button>
                    )}
                    <button 
                      className="btn-sm btn-outline-danger" 
                      onClick={() => handleDeleteUser(mess.id)}
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
  };

  const renderUserManagement = () => {
    const filtered = usersList.filter(u => {
      const q = userSearch.toLowerCase();
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
      return matchQ && matchRole && matchStatus;
    });

    return (
      <div className="admin-view">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title-sm">User Management</h1>
            <p className="table-subtitle" style={{ marginTop: 4 }}>Manage and monitor all students and mess owners on the platform.</p>
          </div>
        </div>

        <div className="admin-stats-grid" style={{ marginTop: '24px' }}>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{usersList.length}</div>
            </div>
            <div className="stat-icon-wrap icon-orange"><Icon name="users" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{usersList.filter(u => u.status === 'Active').length}</div>
            </div>
            <div className="stat-icon-wrap icon-green"><Icon name="check-circle" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Blocked Users</div>
              <div className="stat-value">{usersList.filter(u => u.status === 'Blocked').length}</div>
            </div>
            <div className="stat-icon-wrap icon-red"><Icon name="x-circle" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">New Registrations (7d)</div>
              <div className="stat-value">{newRegistrationsCount}</div>
            </div>
            <div className="stat-icon-wrap icon-blue"><Icon name="trending-up" /></div>
          </div>
        </div>

        <div className="admin-table-panel">
          <div className="table-panel-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2 className="table-title">All Users</h2>
              <p className="table-subtitle">Showing {filtered.length} of {usersList.length} users</p>
            </div>
            <span className="badge-blue">{usersList.filter(u => u.role === 'Student').length} Students</span>
          </div>
          <div className="table-toolbar">
            <div className="search-input-wrap" style={{ width: 300 }}>
              <span style={{ opacity: 0.4 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select className="filter-select" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                <option>Student</option>
                <option>Mess Owner</option>
              </select>
              <select className="filter-select" value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Active</option>
                <option>Blocked</option>
              </select>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No users match your filters.</td></tr>
              ) : filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar-sm" style={{ backgroundColor: user.role === 'Mess Owner' ? '#FF9800' : '#F26B2E' }}>
                        {user.initials}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#7E7E7E', fontSize: '12px' }}>
                    <div style={{ color: '#7E7E7E', marginBottom: '2px' }}>{user.email}</div>
                    <div>{user.phone}</div>
                  </td>
                  <td>{getRolePill(user.role)}</td>
                  <td>{getStatusPill(user.status)}</td>
                  <td style={{ color: '#7E7E7E', fontSize: '13px' }}>{user.joined}</td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-sm btn-outline-danger" 
                        onClick={() => handleDeleteUser(user.id)}
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
  };

  const renderFeedbackTickets = () => {
    const filtered = ticketsList.filter(t => {
      const q = ticketSearch.toLowerCase();
      const matchQ = !q || t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchStatus = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
      const matchCategory = ticketCategoryFilter === 'All' || t.category === ticketCategoryFilter;
      return matchQ && matchStatus && matchCategory;
    });

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'Urgent': return '#F44336';
        case 'High': return '#E65100';
        case 'Medium': return '#FF9800';
        default: return '#7E7E7E';
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

    return (
      <div className="admin-view">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title-sm">Feedback & Tickets</h1>
            <p className="table-subtitle" style={{ marginTop: 4 }}>Track and resolve user complaints and support requests.</p>
          </div>
        </div>

        <div className="admin-stats-grid" style={{ marginTop: '24px' }}>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Total Tickets</div>
              <div className="stat-value">{ticketsList.length}</div>
            </div>
            <div className="stat-icon-wrap icon-blue"><Icon name="message-square" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Open Tickets</div>
              <div className="stat-value">{ticketsList.filter(t => t.status === 'Open').length}</div>
            </div>
            <div className="stat-icon-wrap icon-red"><Icon name="alert-circle" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{ticketsList.filter(t => t.status === 'In Progress').length}</div>
            </div>
            <div className="stat-icon-wrap icon-orange"><Icon name="trending-up" /></div>
          </div>
          <div className="admin-stat-box-sm">
            <div>
              <div className="stat-label">Resolved</div>
              <div className="stat-value">{ticketsList.filter(t => t.status === 'Resolved').length}</div>
            </div>
            <div className="stat-icon-wrap icon-green"><Icon name="check-circle" /></div>
          </div>
        </div>

        <div className="admin-table-panel">
          <div className="table-panel-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2 className="table-title">Support Tickets</h2>
              <p className="table-subtitle">Showing {filtered.length} of {ticketsList.length} tickets</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge-blue" style={{ background: '#FFEBEE', color: '#F44336' }}>{ticketsList.filter(t => t.priority === 'Urgent').length} Urgent</span>
            </div>
          </div>
          <div className="table-toolbar">
            <div className="search-input-wrap" style={{ width: 300 }}>
              <span style={{ opacity: 0.4 }}>🔍</span>
              <input
                type="text"
                placeholder="Search tickets, users, or IDs..."
                value={ticketSearch}
                onChange={e => setTicketSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select className="filter-select" value={ticketStatusFilter} onChange={e => setTicketStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
              <select className="filter-select" value={ticketCategoryFilter} onChange={e => setTicketCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                <option>Food Quality</option>
                <option>Service</option>
                <option>App Issue</option>
                <option>Billing</option>
              </select>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>User Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No feedback match your search.</td></tr>
              ) : filtered.map(t => (
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

        {/* Ticket Modal */}
        {selectedTicket && (
          <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="admin-modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">{selectedTicket.id}</h2>
                  <div className="modal-subtitle">{selectedTicket.category} • {selectedTicket.date}</div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}><Icon name="x" size={20}/></button>
              </div>
              <div className="modal-body-scroll">
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                   {getStatusBadge(selectedTicket.status)}
                   <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: '1px solid ' + getPriorityColor(selectedTicket.priority), color: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority} Priority</span>
                </div>
                
                <div className="modal-section" style={{ background: '#F9F9F9', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 4 }}>User Message</div>
                  <div style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600, marginBottom: 8 }}>{selectedTicket.subject}</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                    {selectedTicket.description || 'No additional details provided.'}
                  </div>
                </div>

                <div className="modal-section" style={{ marginTop: 24 }}>
                   <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 12 }}>Quick Actions</div>
                   <div style={{ display: 'flex', gap: 10 }}>
                     <button 
                       className="btn-sm btn-success" 
                       style={{ flex: 1 }} 
                       disabled={selectedTicket.status === 'Resolved'}
                       onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Resolved')}
                     >
                       {selectedTicket.status === 'Resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                     </button>
                     <button 
                       className="btn-sm btn-outline-dark" 
                       style={{ flex: 1 }}
                       onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'In Progress')}
                     >
                       Set In Progress
                     </button>
                     <button 
                       className="btn-sm btn-danger" 
                       style={{ flex: 1 }}
                       onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Closed')}
                     >
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

  // ── SVG Revenue Line Chart ────────────────────────────────────────────
  const RevenueChart = () => {
    if (revenueData.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9E9E', fontSize: 13 }}>No revenue data available</div>;
    const W = 520, H = 160, pad = { top: 20, right: 20, bottom: 30, left: 56 };
    const vals = revenueData.map(d => d.revenue);
    const minV = Math.min(...vals) * 0.95;
    const maxV = Math.max(...vals) * 1.05;
    const xStep = (W - pad.left - pad.right) / (revenueData.length - 1);
    const yScale = v => pad.top + (H - pad.top - pad.bottom) * (1 - (v - minV) / (maxV - minV));
    const pts = revenueData.map((d, i) => ({ x: pad.left + i * xStep, y: yScale(d.revenue) }));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${pts[pts.length-1].x} ${H - pad.bottom} L ${pts[0].x} ${H - pad.bottom} Z`;
    const yTicks = [minV, (minV+maxV)/2, maxV].map(v => ({ v, y: yScale(v) }));
    const fmt = v => `₹${(v/1000).toFixed(0)}k`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F26B2E" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#F26B2E" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} y1={t.y} x2={W - pad.right} y2={t.y} stroke="#F0F0F0" strokeWidth="1"/>
            <text x={pad.left - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#9E9E9E">{fmt(t.v)}</text>
          </g>
        ))}
        {/* Area fill */}
        <path d={areaD} fill="url(#revGrad)"/>
        {/* Line */}
        <path d={pathD} fill="none" stroke="#F26B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#F26B2E" strokeWidth="2"/>
            <text x={p.x} y={H - pad.bottom + 18} textAnchor="middle" fontSize="11" fill="#9E9E9E">{revenueData[i].month}</text>
          </g>
        ))}
      </svg>
    );
  };

  // ── SVG Payment Breakdown Bar Chart ──────────────────────────────────
  const BreakdownChart = () => {
    if (paymentBreakdown.length === 0) return <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9E9E', fontSize: 13 }}>No payment data</div>;
    const total = paymentBreakdown.reduce((s, d) => s + d.count, 0);
    const maxCount = Math.max(...paymentBreakdown.map(d => d.count));
    const W = 220, H = 130, barW = 40, gap = 30;
    const startX = (W - (barW * 3 + gap * 2)) / 2;
    const maxH = H - 40;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '160px' }}>
        {paymentBreakdown.map((d, i) => {
          const barH = (d.count / maxCount) * maxH;
          const x = startX + i * (barW + gap);
          const y = H - 28 - barH;
          return (
            <g key={i}>
              <rect x={x} y={H - 28} width={barW} height={0} fill={d.color} rx="4"/>
              <rect x={x} y={y} width={barW} height={barH} fill={d.color} rx="4" opacity="0.85"/>
              <text x={x + barW/2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill={d.color}>{d.count}</text>
              <text x={x + barW/2} y={H - 8} textAnchor="middle" fontSize="10" fill="#9E9E9E">{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // ── Financials Render ──────────────────────────────────────────────────
  const renderFinancials = () => {
    const totalRevenue = mockTransactions.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
    const monthlyRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0;
    const pendingAmount = mockTransactions.filter(t => t.status === 'Pending').reduce((s, t) => s + t.amount, 0);
    const completedCount = mockTransactions.filter(t => t.status === 'Paid').length;

    const filtered = mockTransactions.filter(tx => {
      const q = finSearch.toLowerCase();
      const matchQ = !q || tx.id.toLowerCase().includes(q) || tx.mess.toLowerCase().includes(q) || tx.user.toLowerCase().includes(q);
      const matchMess = finMessFilter === 'All' || tx.mess === finMessFilter;
      const matchStatus = finStatusFilter === 'All' || tx.status === finStatusFilter;
      return matchQ && matchMess && matchStatus;
    });

    const getPayStatusPill = (status) => {
      const map = {
        'Paid': <span className="fin-pill fin-paid">✓ Paid</span>,
        'Pending': <span className="fin-pill fin-pending">⏳ Pending</span>,
        'Failed': <span className="fin-pill fin-failed">✕ Failed</span>,
      };
      return map[status] || null;
    };

    return (
      <div className="admin-view">
        {/* Header */}
        <div className="fin-header">
          <div>
            <h1 className="admin-title-sm">Financials</h1>
            <p className="table-subtitle" style={{ marginTop: 4 }}>Track revenue, payments, and transaction activity across all messes.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="admin-stats-grid" style={{ marginTop: 24 }}>
          <div className="fin-stat-card">
            <div className="fin-stat-top">
              <div className="stat-icon-wrap icon-orange" style={{ marginBottom: 0 }}><Icon name="dollar-sign" /></div>
            </div>
            <div className="fin-stat-amount">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Revenue</div>
          </div>

          <div className="fin-stat-card">
            <div className="fin-stat-top">
              <div className="stat-icon-wrap icon-green" style={{ marginBottom: 0 }}><Icon name="check-circle" /></div>
            </div>
            <div className="fin-stat-amount">₹{monthlyRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Monthly Revenue (Apr)</div>
          </div>

          <div className="fin-stat-card">
            <div className="fin-stat-top">
              <div className="stat-icon-wrap icon-peach" style={{ marginBottom: 0 }}><Icon name="alert-circle" /></div>
              <span style={{ fontSize: 11, color: '#FF9800', fontWeight: 700, background: '#FFF3E0', padding: '4px 8px', borderRadius: 12 }}>2 txns</span>
            </div>
            <div className="fin-stat-amount" style={{ color: '#FF9800' }}>₹{pendingAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Pending Payments</div>
          </div>

          <div className="fin-stat-card">
            <div className="fin-stat-top">
              <div className="stat-icon-wrap icon-blue" style={{ marginBottom: 0 }}><Icon name="check-circle" /></div>
              <span style={{ fontSize: 11, color: '#1976D2', fontWeight: 700, background: '#E3F2FD', padding: '4px 8px', borderRadius: 12 }}>this month</span>
            </div>
            <div className="fin-stat-amount" style={{ color: '#1976D2' }}>{completedCount}</div>
            <div className="stat-label">Completed Transactions</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="admin-table-panel" style={{ marginTop: 24 }}>
          <div className="table-panel-header">
            <div>
              <h2 className="table-title">All Transactions</h2>
              <p className="table-subtitle">Showing {filtered.length} of {mockTransactions.length} records</p>
            </div>
            <span className="badge-blue">{mockTransactions.filter(t => t.status === 'Paid').length} Paid</span>
          </div>

          {/* Filters toolbar */}
          <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="search-input-wrap" style={{ width: 280 }}>
              <span style={{ opacity: 0.4 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by ID, mess, or user..."
                value={finSearch}
                onChange={e => setFinSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select className="filter-select" value={finMessFilter} onChange={e => setFinMessFilter(e.target.value)}>
                <option value="All">All Messes</option>
                {[...new Set(mockTransactions.map(t => t.mess))].map(m => <option key={m}>{m}</option>)}
              </select>
              <select className="filter-select" value={finStatusFilter} onChange={e => setFinStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
              <select className="filter-select" value={finDateFilter} onChange={e => setFinDateFilter(e.target.value)}>
                <option value="All">All Dates</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Last 3 Months</option>
              </select>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Mess Name</th>
                <th>User</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No transactions match your filters.</td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600, color: '#F26B2E', fontFamily: 'monospace', fontSize: 13 }}>{tx.id}</td>
                  <td style={{ fontWeight: 500 }}>
                    <span style={{ color: '#7E7E7E', marginRight: 6 }}><Icon name="utensils" size={12}/></span>{tx.mess}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="fin-user-avatar">{tx.user.charAt(0)}</div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{tx.user}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{tx.amount.toLocaleString('en-IN')}</td>
                  <td>{getPayStatusPill(tx.status)}</td>
                  <td style={{ color: '#9E9E9E', fontSize: 13 }}>{tx.date}</td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-sm btn-outline-dark" onClick={() => setSelectedTx(tx)}>
                        <Icon name="eye" size={13} /> View
                      </button>
                      <button className="btn-sm" style={{ background: '#F0F7FF', color: '#1976D2', border: '1px solid #BBDEFB' }}>
                        <Icon name="file-text" size={13} /> Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="admin-modal-overlay" onClick={() => setSelectedTx(null)}>
            <div className="admin-modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title" style={{ fontSize: 20 }}>Transaction Details</h2>
                  <div className="modal-subtitle">{selectedTx.id}</div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedTx(null)}><Icon name="x" size={20}/></button>
              </div>
              <div className="modal-body-scroll" style={{ paddingTop: 0 }}>
                <div className="fin-tx-detail-card">
                  <div className="fin-tx-amount">₹{selectedTx.amount.toLocaleString('en-IN')}</div>
                  <div style={{ marginTop: 4 }}>{selectedTx.status === 'Paid' ? <span className="fin-pill fin-paid">✓ Paid</span> : selectedTx.status === 'Pending' ? <span className="fin-pill fin-pending">⏳ Pending</span> : <span className="fin-pill fin-failed">✕ Failed</span>}</div>
                </div>
                {[
                  ['Transaction ID', selectedTx.id],
                  ['Mess Name', selectedTx.mess],
                  ['User', selectedTx.user],
                  ['Date', selectedTx.date],
                  ['Payment Method', 'UPI / Online Transfer'],
                  ['Platform Fee', '₹' + Math.round(selectedTx.amount * 0.02).toLocaleString('en-IN') + ' (2%)'],
                  ['Net Amount', '₹' + Math.round(selectedTx.amount * 0.98).toLocaleString('en-IN')],
                ].map(([label, value]) => (
                  <div key={label} className="fin-detail-row">
                    <span className="fin-detail-label">{label}</span>
                    <span className="fin-detail-value">{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn-primary-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="file-text" size={14} /> Download Invoice
                  </button>
                  <button className="btn-sm btn-outline-dark" style={{ flex: 1, padding: '10px 16px', justifyContent: 'center' }} onClick={() => setSelectedTx(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModal = () => {
    if (isAddMessModalOpen) {
      return (
        <div className="admin-modal-overlay" onClick={() => { setIsAddMessModalOpen(false); setShowMessPassword(false); }}>
          <div className="admin-modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Add New Mess</h2>
                <div className="modal-subtitle">Register a new mess onto the platform</div>
              </div>
              <button className="modal-close-btn" onClick={() => { setIsAddMessModalOpen(false); setShowMessPassword(false); }}><Icon name="x" size={20}/></button>
            </div>
            <form onSubmit={handleAddMess} className="modal-body-scroll" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="info-label">Mess Name</label>
                  <input type="text" required className="edit-input" placeholder="Enter mess name" value={newMessData.name} onChange={e => setNewMessData({...newMessData, name: e.target.value})} style={{ width: '100%', marginTop: 4 }} />
                </div>
                <div>
                  <label className="info-label">Owner Name</label>
                  <input type="text" required className="edit-input" placeholder="Enter owner's full name" value={newMessData.owner} onChange={e => setNewMessData({...newMessData, owner: e.target.value})} style={{ width: '100%', marginTop: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="info-label">Email Address</label>
                    <input type="email" required className="edit-input" placeholder="owner@email.com" value={newMessData.email} onChange={e => setNewMessData({...newMessData, email: e.target.value})} style={{ width: '100%', marginTop: 4 }} />
                  </div>
                  <div>
                    <label className="info-label">Phone Number</label>
                    <input type="text" required className="edit-input" placeholder="+91 00000 00000" value={newMessData.phone} onChange={e => setNewMessData({...newMessData, phone: e.target.value})} style={{ width: '100%', marginTop: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div>
                    <label className="info-label">Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 4 }}>
                      <input 
                        type={showMessPassword ? "text" : "password"} 
                        required 
                        className="edit-input" 
                        placeholder="Enter password" 
                        value={newMessData.password} 
                        onChange={e => setNewMessData({...newMessData, password: e.target.value})} 
                        style={{ width: '100%', paddingRight: '40px' }} 
                      />
                      <div className="eye-icon" onClick={() => setShowMessPassword(!showMessPassword)} style={{ position: 'absolute', right: '14px', cursor: 'pointer', color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', stroke: 'currentColor', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                          {showMessPassword && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />}
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="info-label">Mess Location</label>
                  <input type="text" required className="edit-input" placeholder="Area, City" value={newMessData.location} onChange={e => setNewMessData({...newMessData, location: e.target.value})} style={{ width: '100%', marginTop: 4 }} />
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-outline-dark btn-sm" style={{ flex: 1 }} onClick={() => { setIsAddMessModalOpen(false); setShowMessPassword(false); }}>Cancel</button>
                  <button type="submit" className="btn-primary-sm" style={{ flex: 1 }}>Register Mess</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (selectedUser) {
      return (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="user-avatar-sm" style={{ width: 48, height: 48, fontSize: 18, backgroundColor: selectedUser.role === 'Mess Owner' ? '#FF9800' : '#F26B2E' }}>
                  {selectedUser.initials}
                </div>
                <div>
                  <h2 className="modal-title">{selectedUser.name}</h2>
                  <div className="modal-subtitle">{selectedUser.role} • Joined {selectedUser.joined}</div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}><Icon name="x" size={20}/></button>
            </div>
            <div className="modal-body-scroll">
              <div className="modal-section">
                <h3 className="section-heading">Account Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div className="info-label">Email Address</div>
                    <div className="info-value" style={{ fontSize: 14 }}>{selectedUser.email}</div>
                  </div>
                  <div>
                    <div className="info-label">Phone Number</div>
                    <div className="info-value" style={{ fontSize: 14 }}>{selectedUser.phone}</div>
                  </div>
                  <div>
                    <div className="info-label">Account Status</div>
                    <div>{getStatusPill(selectedUser.status)}</div>
                  </div>
                  <div>
                    <div className="info-label">User ID</div>
                    <div className="info-value" style={{ fontSize: 14 }}>#USR-{selectedUser.id}00{selectedUser.id}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedMess) return null;

    const messReviews = selectedMessReviews;
    const messComplaints = ticketsList.filter(t => t.mess === selectedMess.name);
    const avgRating = messReviews.length > 0 
      ? (messReviews.reduce((acc, r) => acc + r.rating, 0) / messReviews.length).toFixed(1)
      : selectedMess.rating;

    return (
      <div className="admin-modal-overlay" onClick={() => { setSelectedMess(null); setActiveModalTab('Overview'); }}>
        <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
             <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <h2 className="modal-title" style={{ margin: 0 }}>{selectedMess.name}</h2>
                   {getStatusPill(selectedMess.status)}
                </div>
                <div className="modal-subtitle" style={{ marginTop: 4 }}>View complete mess details, reviews, and complaints</div>
             </div>
             <button className="modal-close-btn" onClick={() => { setSelectedMess(null); setActiveModalTab('Overview'); }}><Icon name="x" size={20}/></button>
          </div>
          
          <div className="modal-tabs">
             <div className={`modal-tab ${activeModalTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveModalTab('Overview')}>Overview</div>
             <div className={`modal-tab ${activeModalTab === 'Reviews' ? 'active' : ''}`} onClick={() => setActiveModalTab('Reviews')}>Reviews <span className="tab-badge blue-badge">{messReviews.length}</span></div>
             <div className={`modal-tab ${activeModalTab === 'Complaints' ? 'active' : ''}`} onClick={() => setActiveModalTab('Complaints')}>Complaints <span className="tab-badge orange-badge">{messComplaints.length}</span></div>
          </div>

          <div className="modal-body-scroll">
            {activeModalTab === 'Overview' && (
              <>
                <div className="modal-section">
                   <h3 className="section-heading">Basic Information</h3>
                   
                   <div className="info-block">
                     <div className="info-label">Owner Name</div>
                     <div className="info-value">{selectedMess.owner}</div>
                   </div>
                   
                   <div className="info-block">
                     <div className="info-label">Contact Number</div>
                     <div className="info-value">{selectedMess.phone}</div>
                   </div>

                   <div className="info-block">
                     <div className="info-label">Email Address</div>
                     <div className="info-value">{selectedMess.email}</div>
                   </div>

                   <div className="info-block">
                     <div className="info-label">Joined Date</div>
                     <div className="info-value">{selectedMess.joined}</div>
                   </div>

                   <div className="info-block">
                     <div className="info-label">Address</div>
                     <div className="info-value">{selectedMess.location}</div>
                   </div>
                </div>

                <div className="modal-section" style={{ border: '1px solid #F0F0F0', borderRadius: '12px' }}>
                   <h3 className="section-heading" style={{ margin: '16px 16px 8px' }}>Performance Statistics</h3>
                   <div className="perf-stats-grid">
                      <div className="perf-stat-box perf-blue">
                         <Icon name="users" size={20} />
                         <div className="perf-val">{selectedMess.users}</div>
                         <div className="perf-lbl">Total Users</div>
                      </div>
                      <div className="perf-stat-box perf-yellow">
                         <Icon name="star" size={20} />
                         <div className="perf-val">{avgRating}</div>
                         <div className="perf-lbl">Avg Rating</div>
                      </div>
                      <div className="perf-stat-box perf-green">
                         <span style={{ fontSize: '20px' }}>👍</span>
                         <div className="perf-val">{messReviews.length}</div>
                         <div className="perf-lbl">Reviews</div>
                      </div>
                      <div className="perf-stat-box perf-orange">
                         <Icon name="message-square" size={20} />
                         <div className="perf-val">{messComplaints.length}</div>
                         <div className="perf-lbl">Complaints</div>
                      </div>
                   </div>
                </div>

                <div className="modal-section admin-actions-box">
                  <h3 className="section-heading" style={{ color: '#D93025', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Icon name="alert-circle" size={16} /> Admin Actions
                  </h3>
                  <p style={{ fontSize: '12px', color: '#7E7E7E', margin: '0 0 16px' }}>Manage the operational status of this mess. These actions will affect the mess's visibility and accessibility to users.</p>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                     {selectedMess.status !== 'Active' && (
                        <button className="btn-outline-dark btn-sm" style={{ flex: 1, justifyContent: 'center', background: '#388E3C', color: 'white', border: 'none' }} onClick={() => handleToggleMessStatus(selectedMess.id, 'Active')}>
                           {selectedMess.status === 'Blocked' ? 'Unblock Mess' : 'Approve Mess'}
                        </button>
                     )}
                     {selectedMess.status !== 'Blocked' && (
                        <button className="btn-outline-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleToggleMessStatus(selectedMess.id, 'Blocked')}>
                           <Icon name="x-circle" size={14} /> Block Mess
                        </button>
                     )}
                     <button 
                        className="btn-sm btn-danger" 
                        style={{ flex: 1, justifyContent: 'center', background: '#D32F2F', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
                        onClick={() => handleDeleteUser(selectedMess.id)}
                     >
                        <Icon name="trash" size={14} /> Delete Mess
                     </button>
                  </div>
                </div>
              </>
            )}

            {activeModalTab === 'Reviews' && (
              <div className="modal-section">
                {messReviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No reviews yet for this mess.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messReviews.map(r => (
                      <div key={r.id} style={{ padding: 16, border: '1px solid #EEE', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700 }}>{r.user_name}</span>
                          <span style={{ color: '#FF9800' }}>⭐ {r.rating}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{r.comment}</p>
                        <div style={{ fontSize: 11, color: '#9E9E9E', marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'Complaints' && (
              <div className="modal-section">
                {messComplaints.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9E9E9E' }}>No complaints filed for this mess.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messComplaints.map(t => (
                      <div key={t.id} style={{ padding: 16, border: '1px solid #EEE', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700 }}>{t.subject}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F5F5F5' }}>{t.status}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{t.user}</p>
                        <div style={{ fontSize: 11, color: '#9E9E9E', marginTop: 8 }}>{t.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#F26B2E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'black' }}>GS</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>GrubSpot</div>
            <div style={{ fontSize: 11, color: '#7E7E7E', marginTop: 4, fontWeight: 600 }}>Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch', justifyContent: 'flex-start' }}>
          {navItems.map((item) => (
            <div 
              key={item.id} 
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span className="admin-nav-label">{item.label}</span>
              {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-box" style={{ background: 'transparent', borderRadius: '10px' }}>
             <div className="admin-avatar">AD</div>
             <div>
               <div className="admin-username">Admin User</div>
               <div className="admin-role">Administrator</div>
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
         {activeTab === 'Dashboard' && renderDashboard()}
         {activeTab === 'Mess Management' && renderMessManagement()}
         {activeTab === 'User Management' && renderUserManagement()}
         {activeTab === 'Financials' && renderFinancials()}
         {activeTab === 'Feedback/Tickets' && renderFeedbackTickets()}

      </main>

      {renderModal()}
    </div>
  );
}

export default AdminPanel;
