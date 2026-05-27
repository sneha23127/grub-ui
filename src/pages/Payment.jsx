import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safe state extraction
  const [paymentData, setPaymentData] = useState({
    messName: 'Mess',
    totalAmount: 0,
    selectedPlan: 'Plan',
    homeDelivery: false,
    paymentOptions: { upi: true, cash: true },
    selectedMeals: {
      breakfast: false,
      lunch: { selected: false, type: 'Veg' },
      dinner: { selected: false, type: 'Veg' }
    }
  });

  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    if (location.state) {
      setPaymentData({
        messName: location.state.messName || 'Mess',
        messId: location.state.messId || null,
        totalAmount: location.state.totalAmount || 0,
        selectedPlan: location.state.selectedPlan || 'Plan',
        homeDelivery: location.state.homeDelivery || false,
        paymentOptions: location.state.paymentOptions || { upi: true, cash: true },
        selectedMeals: location.state.selectedMeals || {
          breakfast: false,
          lunch: { selected: false, type: 'Veg' },
          dinner: { selected: false, type: 'Veg' }
        }
      });
      // Auto-select the only available method
      const opts = location.state.paymentOptions || { upi: true, cash: true };
      if (opts.upi && !opts.cash) setPaymentMethod('upi');
      if (!opts.upi && opts.cash) setPaymentMethod('cash');
    }
    window.scrollTo(0, 0);
  }, [location.state]);

  const handlePayment = () => {
    // Generate renewal date based on plan
    const today = new Date();
    let renewalDate = new Date();
    if (paymentData.selectedPlan === 'Trial (15 Days)') renewalDate.setDate(today.getDate() + 15);
    else if (paymentData.selectedPlan === '3 Months') renewalDate.setMonth(today.getMonth() + 3);
    else renewalDate.setMonth(today.getMonth() + 1); // Default 1 month

    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = renewalDate.toLocaleDateString('en-GB', dateOptions);

    const user = JSON.parse(sessionStorage.getItem('user') || 'null');

    const subscriptionData = {
      user_id: user?.id,
      user_name: user?.name || 'Guest Student',
      user_phone: user?.phone || 'N/A',
      user_email: user?.email || 'N/A',
      mess_name: paymentData.messName,
      plan_duration: paymentData.selectedPlan,
      meals: getMealBreakdown(),
      delivery_type: paymentData.homeDelivery ? 'Home Delivery' : 'Dine-in',
      total_amount: paymentData.totalAmount,
      payment_method: paymentMethod,
      expiry_date: renewalDate.toISOString().split('T')[0] // YYYY-MM-DD
    };

    const submitSubscription = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });
        const data = await response.json();
        
        if (data.status === 'success') {
          const storageKey = user ? `activeSubscriptions_${user.id}` : 'activeSubscriptions_guest';
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          const frontendSub = {
            id: data.subscription.id,
            ...subscriptionData,
            name: subscriptionData.mess_name,
            image: `https://placehold.co/150x150/F26B2E/FFFFFF?text=${subscriptionData.mess_name.charAt(0)}`,
            cuisine: 'Indian',
            diet: '',
            dateLabel: 'Renews',
            dateVal: formattedDate,
            statusType: 'ACTIVE'
          };
          
          localStorage.setItem(storageKey, JSON.stringify([frontendSub, ...existing]));
          
          alert(`Payment of ₹${paymentData.totalAmount} successful! Subscription confirmed.`);
          navigate('/subscriptions');
        } else {
          alert('Error saving subscription: ' + data.message);
        }
      } catch (err) {
        console.error('Subscription error:', err);
        alert('Failed to connect to server. Please try again.');
      }
    };

    if (paymentMethod === 'cash') {
      submitSubscription();
    } else if (paymentMethod === 'upi') {
      const initializeRazorpay = async () => {
        try {
          const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: paymentData.totalAmount,
              user_id: user?.id,
              mess_name: paymentData.messName
            })
          });
          const orderData = await orderRes.json();

          if (orderData.status !== 'success') {
            alert('Error creating payment order: ' + orderData.message);
            return;
          }

          const options = {
            key: 'rzp_test_StZ7xNy0slGGDt', // Provided Razorpay Test Key
            amount: orderData.order.amount,
            currency: 'INR',
            name: 'GrubSpot',
            description: `Subscription for ${paymentData.messName}`,
            order_id: orderData.order.id,
            handler: async function (response) {
              try {
                const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    subscriptionData: subscriptionData
                  })
                });
                const verifyData = await verifyRes.json();

                if (verifyData.status === 'success') {
                  // Fallback for local storage
                  const storageKey = user ? `activeSubscriptions_${user.id}` : 'activeSubscriptions_guest';
                  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  const frontendSub = {
                    id: verifyData.subscription?.id || Date.now(),
                    ...subscriptionData,
                    name: subscriptionData.mess_name,
                    image: `https://placehold.co/150x150/F26B2E/FFFFFF?text=${subscriptionData.mess_name.charAt(0)}`,
                    cuisine: 'Indian',
                    diet: '',
                    dateLabel: 'Renews',
                    dateVal: formattedDate,
                    statusType: 'ACTIVE'
                  };
                  localStorage.setItem(storageKey, JSON.stringify([frontendSub, ...existing]));
                  
                  alert(`Payment successful! Subscription confirmed.`);
                  navigate('/subscriptions');
                } else {
                  alert('Payment verification failed: ' + verifyData.message);
                }
              } catch (err) {
                console.error('Verification error:', err);
                alert('Payment verified but error creating subscription.');
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: user?.phone || ''
            },
            theme: {
              color: '#F26B2E'
            }
          };

          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function (response){
            alert('Payment Failed: ' + response.error.description);
          });
          rzp1.open();
        } catch (err) {
          console.error('Razorpay initialization error:', err);
          alert('Could not open payment gateway.');
        }
      };

      initializeRazorpay();
    }
  };

  const getMealBreakdown = () => {
    const meals = [];
    const sm = paymentData.selectedMeals;
    // Check if we need to show the type (only if mess is Veg & Non-Veg)
    // For now, let's just make it concise.
    if (sm?.breakfast) meals.push('Breakfast');
    if (sm?.lunch?.selected) meals.push(`Lunch${sm.lunch.type === 'NonVeg' ? ' (Non-Veg)' : ''}`);
    if (sm?.dinner?.selected) meals.push(`Dinner${sm.dinner.type === 'NonVeg' ? ' (Non-Veg)' : ''}`);
    return meals.length > 0 ? meals.join(', ') : 'No meals selected';
  };

  return (
    <div className="home-page" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      
      <main className="container" style={{ flex: 1, padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Payment Methods */}
          <div className="admin-table-panel" style={{ padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: 'white' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>Payment Method</h1>
            <p style={{ color: '#7E7E7E', fontSize: '14px', marginBottom: '32px' }}>Choose how you'd like to pay for your subscription.</p>

            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Select Method</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {paymentData.paymentOptions?.upi !== false && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: `2px solid ${paymentMethod === 'upi' ? '#F26B2E' : '#E5E7EB'}`, 
                  background: paymentMethod === 'upi' ? '#FFF8F1' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => setPaymentMethod('upi')}
              >
                <div style={{ marginRight: '12px', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #F26B2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {paymentMethod === 'upi' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F26B2E' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>Online UPI</div>
                  <div style={{ fontSize: '12px', color: '#7E7E7E' }}>GPay, PhonePe, Paytm, etc.</div>
                </div>
              </div>
              )}

              {paymentData.paymentOptions?.cash !== false && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: `2px solid ${paymentMethod === 'cash' ? '#F26B2E' : '#E5E7EB'}`, 
                  background: paymentMethod === 'cash' ? '#FFF8F1' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => setPaymentMethod('cash')}
              >
                <div style={{ marginRight: '12px', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #F26B2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {paymentMethod === 'cash' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F26B2E' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>Pay in Cash</div>
                  <div style={{ fontSize: '12px', color: '#7E7E7E' }}>Pay directly at the mess counter</div>
                </div>
              </div>
              )}
            </div>

            <button 
              className="submit-btn" 
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700' }}
              onClick={handlePayment}
            >
              {paymentMethod === 'upi' ? 'Pay Now' : 'Confirm Subscription'}
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              style={{ 
                width: '100%', 
                background: 'none', 
                border: 'none', 
                color: '#7E7E7E', 
                fontSize: '14px', 
                marginTop: '16px', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Go Back
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <div className="admin-table-panel" style={{ padding: '24px', borderRadius: '16px', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#7E7E7E', fontSize: '14px' }}>Mess Name</span>
                <span style={{ color: '#1A1A1A', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>{paymentData.messName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#7E7E7E', fontSize: '14px' }}>Plan Duration</span>
                <span style={{ color: '#1A1A1A', fontWeight: '600', fontSize: '14px' }}>{paymentData.selectedPlan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#7E7E7E', fontSize: '14px' }}>Included Meals</span>
                <span style={{ color: '#F26B2E', fontWeight: '600', fontSize: '13px', textAlign: 'right', maxWidth: '180px' }}>{getMealBreakdown()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7E7E7E', fontSize: '14px' }}>Home Delivery</span>
                <span style={{ color: '#1A1A1A', fontWeight: '600', fontSize: '14px' }}>{paymentData.homeDelivery ? '₹200' : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '2px dashed #F3F4F6' }}>
                <span style={{ color: '#1A1A1A', fontWeight: '800', fontSize: '16px' }}>Grand Total</span>
                <span style={{ color: '#F26B2E', fontWeight: '800', fontSize: '24px' }}>₹{paymentData.totalAmount}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: '1.4' }}>
                Your payment is 100% secure. We use industry-standard encryption for all transactions.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Payment;
