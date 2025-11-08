import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/home');
      } else {
        setError(data.error || 'Registration failed');
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
        width: '401px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '68px'
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

        {/* Register Form Container */}
        <div style={{
          width: '401px',
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Copy Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            position: 'absolute',
            top: 0,
            left: '55px'
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
              Create an account
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '1.5em',
              textAlign: 'center',
              color: '#000000',
              margin: 0
            }}>
              Enter your email to sign up for this app
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            height: '100%',
            position: 'relative'
          }}>
            {/* Email Field */}
            <div style={{
              position: 'absolute',
              top: '88px',
              left: '1px',
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
              position: 'absolute',
              top: '155px',
              left: '1px',
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
                minLength="6"
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

            {/* Confirm Password Field */}
            <div style={{
              position: 'absolute',
              top: '222px',
              left: '1px',
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="confirm password"
                required
                minLength="6"
                disabled={loading}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: confirmPassword ? '#000000' : '#828282',
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
                position: 'absolute',
                top: '285px',
                left: '0px',
                width: '400px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: '#ff4444',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                position: 'absolute',
                top: '300px',
                left: '0px',
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
                gap: '8px'
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </span>
            </button>
          </form>

          {/* Login Link */}
          <p style={{
            position: 'absolute',
            top: '360px',
            left: '0px',
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
            Already have an account? <Link 
              to="/login" 
              style={{
                color: '#000000',
                textDecoration: 'underline',
                fontWeight: 500,
                marginLeft: '4px'
              }}
            >
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;