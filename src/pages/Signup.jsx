import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phoneNum: '',
    role: 'student',
    mess_name: '',
    address: '',
    password: '',
    agreed: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phoneNum || !formData.password || (formData.role !== 'admin' && !formData.address)) {
      alert("Please fill out all required fields.");
      return;
    }
    if (formData.role === 'mess_owner' && !formData.mess_name) {
      alert("Please provide your mess name.");
      return;
    }
    if (!formData.agreed) {
      alert("You must agree to the Terms of Service.");
      return;
    }

    const fullPhone = `${formData.countryCode} ${formData.phoneNum}`;

    try {
      const response = await axios.post('http://localhost:5000/api/signup', {
        name: formData.name,
        email: formData.email,
        phone: fullPhone,
        role: formData.role,
        mess_name: formData.role === 'mess_owner' ? formData.mess_name : null,
        address: formData.address,
        password: formData.password
      });

      if (response.data.status === 'success') {
        alert("Account created successfully!");
        navigate('/login');
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "An error occurred during signup");
    }
  };

  return (
    <div className="split-screen">
      {/* Left Pane (Image & Text) */}
      <div className="left-pane">
        <div className="brand">
          <div className="logo-icon">GS</div>
          <div className="brand-name">GrubSpot</div>
        </div>
        <h1 className="left-title">Join thousands of students eating better every day</h1>
        <p className="left-subtitle">Sign up free · No credit card required</p>
      </div>

      {/* Right Pane (Form) */}
      <div className="right-pane">
        <div className="form-container">
          <div className="get-started">GET STARTED</div>
          <h2 className="form-title">Sign Up</h2>
          <p className="form-subtitle">Create an account to discover messes near you</p>

          <form onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Rahul Sharma" />
            </div>

            {/* Email Address */}
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
            </div>

            {/* Phone Number */}
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div className="phone-inputs">
                <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="input-field country-code">
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <input type="tel" name="phoneNum" value={formData.phoneNum} onChange={handleChange} className="input-field phone-number" placeholder="98765 43210" />
              </div>
            </div>

            {/* Role Specific Fields */}
            {formData.role === 'mess_owner' && (
              <div className="input-group">
                <label className="input-label">Mess Name</label>
                <input type="text" name="mess_name" value={formData.mess_name} onChange={handleChange} className="input-field" placeholder="Sunrise Hostel Mess" />
              </div>
            )}

            {formData.role !== 'admin' && (
              <div className="input-group">
                <label className="input-label">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder={formData.role === 'student' ? "Hostel/PG address in Bengaluru" : "Business address"} />
              </div>
            )}

            {/* Password */}
            <div className="input-group">
              <label className="input-label">Create a Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field" 
                  placeholder="Create a strong password" 
                />
                <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    {showPassword && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />}
                  </svg>
                </div>
              </div>
              
              {/* Password Requirements Checklist */}
              <div style={{ marginTop: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password must contain:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: '8+ Characters', met: formData.password.length >= 8 },
                    { label: 'One Uppercase', met: /[A-Z]/.test(formData.password) },
                    { label: 'One Number', met: /[0-9]/.test(formData.password) },
                    { label: 'Special Char', met: /[^A-Za-z0-9]/.test(formData.password) }
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

            {/* Checkbox */}
            <div className="checkbox-group">
              <input type="checkbox" id="terms" name="agreed" checked={formData.agreed} onChange={handleChange} />
              <label htmlFor="terms" className="checkbox-label">
                I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" >
              Sign Up
            </button>
            
            {/* Footer Text */}
            <div className="footer-text">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
