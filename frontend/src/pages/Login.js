import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        const lastPath = localStorage.getItem('lastVisitedPath');
        navigate(lastPath || '/home');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px'
      }}>
        {/* Header */}
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '32px',
          lineHeight: '1.5em',
          letterSpacing: '-1%',
          textAlign: 'center',
          color: '#000000',
          margin: 0
        }}>
          Release Management
        </h1>

        {/* Login Form Container */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Login Title */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '1.5em',
              letterSpacing: '-1%',
              textAlign: 'center',
              color: '#000000',
              margin: 0
            }}>
              Login
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            {/* Email Field */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              width: '368px',
              height: '48px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              gap: '16px'
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                required
                disabled={loading}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: email ? '#000000' : '#828282',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              width: '368px',
              height: '48px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              gap: '16px'
            }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                disabled={loading}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: password ? '#000000' : '#828282',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: '#ff4444',
                textAlign: 'center',
                margin: '8px 0'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0px 16px',
                width: '400px',
                height: '40px',
                backgroundColor: '#000000',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                gap: '8px',
                marginTop: '26px'
              }}
            >
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '1.5em',
                color: '#FFFFFF',
                textAlign: 'center'
              }}>
                {loading ? 'Logging in...' : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Register Link */}
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '1.5em',
            textAlign: 'center',
            color: '#828282',
            margin: 0,
            width: '400px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Don't have an account? <Link 
              to="/register" 
              style={{
                color: '#000000',
                textDecoration: 'underline',
                fontWeight: 500,
                marginLeft: '4px'
              }}
            >
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;