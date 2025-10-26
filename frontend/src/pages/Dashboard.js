import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome to Release Management!</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Hello, {user?.email}! {user?.is_admin && <span style={{ color: '#007bff', fontWeight: 'bold' }}>(Admin)</span>}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>🎉 Authentication Successful!</h2>
        <p>You have successfully logged into the Release Management application.</p>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {dashboardData && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Dashboard Data:</h3>
          <pre style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ backgroundColor: '#e9ecef', padding: '20px', borderRadius: '4px' }}>
        <h3>User Information:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <strong>ID:</strong> {user?.id}
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Email:</strong> {user?.email}
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Admin Status:</strong> {user?.is_admin ? 'Yes' : 'No'}
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Created:</strong> {user?.created_at && new Date(user.created_at).toLocaleString()}
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center', color: '#666' }}>
        <p>This is a simple landing page to demonstrate successful authentication.</p>
        <p>Your application is ready for further development!</p>
      </div>
    </div>
  );
};

export default Dashboard;