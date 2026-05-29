import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import signupBg from '../assets/signup-bg.png';

// Per-country phone validation rules — IN, UK, UAE only
const PHONE_RULES = {
  '+91': {
    label: 'IN',
    digits: 10,
    pattern: /^[6-9]\d{9}$/,
    placeholder: '98765 43210',
    hint: '10 digits, starts with 6–9 (e.g. 9876543210)'
  },
  '+44': {
    label: 'UK',
    digits: 10,
    pattern: /^[1-9]\d{8,9}$/,
    placeholder: '7911 123456',
    hint: '9–10 digits without leading 0 (e.g. 7911123456)'
  },
  '+971': {
    label: 'UAE',
    digits: 9,
    pattern: /^[0-9]\d{8}$/,
    placeholder: '501234567',
    hint: '9 digits (e.g. 501234567)'
  },
};

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locStatus, setLocStatus] = useState(''); // 'success' | 'error' | ''
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
    agreed: false,
    latitude: null,
    longitude: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Clear phone number when country code changes so stale digits don't persist
      ...(name === 'countryCode' ? { phoneNum: '' } : {})
    }));

    // Live email validation
    if (name === 'email' || name === 'role') {
      const emailVal = name === 'email' ? value : formData.email;
      const roleVal  = name === 'role'  ? value : formData.role;
      if (emailVal) {
        const el = emailVal.trim().toLowerCase();
        if (roleVal === 'mess_owner') {
          setEmailError(el.endsWith('@gmail.com') ? '' : 'Mess owner email must be @gmail.com');
        } else {
          setEmailError(
            (el.endsWith('@gmail.com') || el.endsWith('@kristujayanti.com'))
              ? ''
              : 'Must be @gmail.com or @kristujayanti.com'
          );
        }
      } else {
        setEmailError('');
      }
    }

    // Live phone validation feedback
    if (name === 'phoneNum' || name === 'countryCode') {
      const code = name === 'countryCode' ? value : formData.countryCode;
      const num  = name === 'phoneNum'    ? value : '';
      const rule = PHONE_RULES[code];
      if (!num) {
        setPhoneError('');
      } else {
        const raw = num.replace(/\s/g, '');
        if (rule && !rule.pattern.test(raw)) {
          setPhoneError(`Invalid number for ${code}. ${rule.hint}.`);
        } else {
          setPhoneError('');
        }
      }
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('error');
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocStatus('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log('[Signup] Detected location:', lat, lng);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setLocating(false);
        setLocStatus('success');
      },
      (err) => {
        console.warn('[Signup] Location error:', err.message);
        setLocating(false);
        setLocStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Derived phone rule for currently selected country code
  const phoneRule = PHONE_RULES[formData.countryCode] || {
    digits: 15, pattern: /^\d{7,15}$/, placeholder: 'Phone number', hint: '7–15 digits'
  };

  // Live validity check (only shown after user starts typing)
  const phoneValid = formData.phoneNum
    ? phoneRule.pattern.test(formData.phoneNum.replace(/\s/g, ''))
    : null;

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

    // Email domain validation based on role
    const emailLower = formData.email.trim().toLowerCase();
    if (formData.role === 'mess_owner') {
      if (!emailLower.endsWith('@gmail.com')) {
        alert("Mess owner email must be a Gmail address (@gmail.com).");
        return;
      }
    } else {
      // student / admin
      if (!emailLower.endsWith('@gmail.com') && !emailLower.endsWith('@kristujayanti.com')) {
        alert("Email must be a Gmail address (@gmail.com) or a Kristu Jayanti address (@kristujayanti.com).");
        return;
      }
    }

    // Country-specific phone validation
    const rawPhone = formData.phoneNum.replace(/\s/g, '');
    if (!rawPhone || !phoneRule.pattern.test(rawPhone)) {
      const msg = `Invalid phone number for ${formData.countryCode}. ${phoneRule.hint}.`;
      setPhoneError(msg);
      alert(msg);
      return;
    }

    const hasLength = formData.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

    if (!hasLength || !hasUppercase || !hasNumber || !hasSpecial) {
      alert("Password must contain at least 8 characters, one uppercase letter, one number, and one special character.");
      return;
    }

    const fullPhone = `${formData.countryCode} ${formData.phoneNum}`;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/signup`, {
        name: formData.name,
        email: formData.email,
        phone: fullPhone,
        role: formData.role,
        mess_name: formData.role === 'mess_owner' ? formData.mess_name : null,
        address: formData.address,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
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
      {/* Left Pane (Background Image & Text) */}
      <div 
        className="left-pane" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75)), url(${signupBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
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
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-field${emailError ? ' input-error' : ''}`} placeholder="you@example.com" />
              {emailError && <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{emailError}</div>}
            </div>

            {/* Phone Number */}
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div className="phone-inputs">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="input-field country-code"
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+971">+971 (UAE)</option>
                </select>
                <input
                  type="tel"
                  name="phoneNum"
                  value={formData.phoneNum}
                  onChange={handleChange}
                  className="input-field phone-number"
                  placeholder={phoneRule.placeholder}
                  maxLength={phoneRule.digits + 2}
                  style={{
                    borderColor: formData.phoneNum
                      ? (phoneValid ? '#10B981' : '#EF4444')
                      : undefined
                  }}
                />
              </div>

              {/* Format hint — always visible in grey */}
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#94A3B8' }}>
                Format: {phoneRule.hint}
              </div>

              {/* Inline error — only shown when input is invalid */}
              {phoneError && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '500'
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {phoneError}
                </div>
              )}

              {/* Valid tick — shown when input is valid */}
              {phoneValid && !phoneError && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '500'
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Valid phone number
                </div>
              )}
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
                {formData.role === 'mess_owner' && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                        background: locating ? '#94A3B8' : '#1E293B', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: locating ? 'not-allowed' : 'pointer', transition: '0.2s'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                      {locating ? 'Detecting...' : 'Detect Location'}
                    </button>
                    {locStatus === 'success' && (
                      <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                        ✓ GPS coordinates captured ({formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)})
                      </span>
                    )}
                    {locStatus === 'error' && (
                      <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>✗ Location access denied</span>
                    )}
                  </div>
                )}
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
