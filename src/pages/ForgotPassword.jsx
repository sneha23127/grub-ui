import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import thaliImg from '../assets/thali.png';

function ForgotPassword() {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', text: '' }

  // Refs for OTP inputs
  const otpInputsRef = useRef([]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Keep only last digit
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      // Focus the last input
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setBanner({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }

    setSendingOtp(true);
    setBanner(null);

    try {
      const response = await axios.post('http://localhost:5000/api/forgot-password', { email });
      if (response.data.status === 'success') {
        setOtpSent(true);
        setCooldown(60); // 60 seconds cooldown
        setBanner({
          type: 'success',
          text: `Verification code sent! Simulated OTP: ${response.data.otp}`,
          link: response.data.previewUrl
        });
        
        // Auto-fill OTP in development for convenience
        const otpDigits = response.data.otp.split('');
        setOtp(otpDigits);
        // Focus verification field
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to send verification code. Please try again.';
      setBanner({ type: 'error', text: msg });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setBanner(null);

    if (!email) {
      setBanner({ type: 'error', text: 'Email address is required.' });
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setBanner({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    if (!password) {
      setBanner({ type: 'error', text: 'Please enter a new password.' });
      return;
    }

    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasLength || !hasUppercase || !hasNumber || !hasSpecial) {
      setBanner({ type: 'error', text: 'Please ensure your new password meets all security requirements.' });
      return;
    }

    if (password !== confirmPassword) {
      setBanner({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/reset-password', {
        email,
        otp: otpCode,
        password
      });

      if (response.data.status === 'success') {
        setBanner({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to reset password. Please verify the code and try again.';
      setBanner({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-screen">
      {/* Left Pane (Background Image & Text) */}
      <div 
        className="left-pane" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75)), url(${thaliImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="brand">
          <div className="logo-icon">GS</div>
          <div className="brand-name">GrubSpot</div>
        </div>
        <h1 className="left-title">Discover trusted home-style mess services near you</h1>
        <p className="left-subtitle">20+ messes · 2000+ students · Bengaluru</p>
      </div>

      {/* Right Pane (Form) */}
      <div className="right-pane">
        <div className="form-container">
          <div className="get-started">ACCOUNT RECOVERY</div>
          <h2 className="form-title">Forgot Password</h2>
          <div style={{ marginBottom: "24px" }}></div>

          {/* Banner message */}
          {banner && (
            <div 
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '20px',
                fontWeight: '500',
                background: banner.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                color: banner.type === 'success' ? '#2E7D32' : '#C62828',
                border: `1px solid ${banner.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {banner.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
              <div style={{ flex: 1 }}>
                <div>{banner.text}</div>
                {banner.link && (
                  <div style={{ marginTop: '6px' }}>
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: '700' }}
                    >
                      View Sent Email (SMTP Test Inbox) ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword}>
            {/* Email Address */}
            <div className="input-group">
              <div className="label-row">
                <label className="input-label">Email Address</label>
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  className="send-otp-btn"
                  disabled={sendingOtp || cooldown > 0 || !email}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
              <input 
                type="email" 
                name="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="input-field" 
                placeholder="you@example.com" 
                disabled={otpSent && cooldown > 0}
                required
              />
            </div>

            {/* Verification Code */}
            <div className="input-group">
              <label className="input-label">Verification Code</label>
              <div className="otp-container" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    pattern="\d*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    placeholder="-"
                    required
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field" 
                  placeholder="••••••••" 
                  required
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
                    { label: '8+ Characters', met: password.length >= 8 },
                    { label: 'One Uppercase', met: /[A-Z]/.test(password) },
                    { label: 'One Number', met: /[0-9]/.test(password) },
                    { label: 'Special Char', met: /[^A-Za-z0-9]/.test(password) }
                  ].map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: req.met ? '#10B981' : '#94A3B8', transition: '0.2s color' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ flexShrink: 0 }}>
                        {req.met ? <polyline points="20 6 9 17 4 12"></polyline> : <circle cx="12" cy="12" r="10"></circle>}
                      </svg>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="input-group" style={{ marginBottom: '28px' }}>
              <label className="input-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field" 
                  placeholder="••••••••" 
                  required
                />
                <div className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    {showConfirmPassword && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />}
                  </svg>
                </div>
              </div>
            </div>

            {/* Reset Password Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
            
            {/* Back to Login */}
            <Link to="/login" className="back-login-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Login</span>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
