import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import MessList from './pages/MessList';
import MessDetail from './pages/MessDetail';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import Subscriptions from './pages/Subscriptions';
import SavedMesses from './pages/SavedMesses';
import AdminPanel from './pages/AdminPanel';
import OwnerPanel from './pages/OwnerPanel';
import Payment from './pages/Payment';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/messes" element={<MessList />} />
        <Route path="/mess/:id" element={<MessDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute allowedRoles={['student']}><Subscriptions /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute allowedRoles={['student']}><SavedMesses /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute allowedRoles={['mess_owner']}><OwnerPanel /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute allowedRoles={['student']}><Payment /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
