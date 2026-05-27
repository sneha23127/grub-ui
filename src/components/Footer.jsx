import React, { useState } from 'react';
import axios from 'axios';

function Footer() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleSendFeedback = async () => {
    if (!message.trim() || !subject.trim()) return;

    setIsSending(true);
    setStatus(null);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.post('http://localhost:5000/api/tickets', {
        user_name: user.name || 'Anonymous Guest',
        subject: subject,
        description: message,
        category: 'General',
        priority: 'Low'
      });
      
      setStatus('success');
      setMessage('');
      setSubject('');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Feedback error:', error);
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const activeSubs = user.id ? JSON.parse(localStorage.getItem(`activeSubscriptions_${user.id}`) || '[]') : [];
  const isSubscriber = user.role === 'student' && activeSubs.length > 0;

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: '16px' }}>
              <div className="logo-icon">GS</div>
              <div className="brand-name" style={{ color: 'white' }}>GrubSpot</div>
            </div>
            <p className="footer-text">
              Helping students in Bengaluru discover the best home-style mess services. 
              Eat well, stay healthy!
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <span className="social-pill">Facebook</span>
              <span className="social-pill">Instagram</span>
              <span className="social-pill">Twitter</span>
            </div>
          </div>
          
          <div className="feedback-form">
            <h3 className="footer-heading">Send Us Feedback</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                style={{ 
                  width: '100%', 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  background: '#222', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: '13px'
                }} 
              />
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder={status === 'success' ? "Thank you!" : "Your message..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSending}
                  style={{ 
                    width: '100%', 
                    padding: '10px 100px 10px 16px', 
                    borderRadius: '12px', 
                    background: status === 'error' ? '#3d1a1a' : '#222', 
                    border: status === 'success' ? '1px solid #4CAF50' : 'none', 
                    color: 'white', 
                    fontSize: '13px',
                    transition: '0.3s'
                  }} 
                />
                <button 
                  className="feedback-send-btn" 
                  onClick={handleSendFeedback}
                  disabled={isSending || !message.trim() || !subject.trim()}
                  style={{ 
                    opacity: isSending || !message.trim() || !subject.trim() ? 0.6 : 1,
                    right: '4px',
                    padding: '5px 12px',
                    fontSize: '12px'
                  }}
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </div>
              {status === 'error' && <p style={{ color: '#ff5252', fontSize: '11px' }}>Failed to send. Please try again.</p>}
            </div>
          </div>

          <div>
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#AAA' }}>
                <span style={{ color: 'var(--orange)' }}>📍</span> 
                GrubSpot HQ, Koramangala 5th Block, Bengaluru - 560095
              </li>
              <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#AAA' }}>
                <span style={{ color: 'var(--orange)' }}>📞</span> 
                +91 80 4567 8900
              </li>
              <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#AAA' }}>
                <span style={{ color: 'var(--orange)' }}>✉️</span> 
                hello@grubspot.in
              </li>
            </ul>
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '12px', color: '#666' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Help Center</span>
            </div>
          </div>
        </div>
        
        <div style={{ paddingTop: '20px', marginTop: '30px', borderTop: '1px solid #222', textAlign: 'center', fontSize: '12px', color: '#444' }}>
          © 2026 GrubSpot. All rights reserved. Made with ❤️ in Bengaluru.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
