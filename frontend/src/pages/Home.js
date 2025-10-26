import React, { useState } from 'react';
import { useAuth } from '../App';

const Home = () => {
  const { user, logout } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeContent, setActiveContent] = useState('welcome');

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      key: 'release',
      title: 'Release',
      icon: '📋',
      items: [
        { key: 'release-manager', title: 'Manager' }
      ]
    },
    {
      key: 'environment',
      title: 'Environment',
      icon: '🌐',
      items: [
        { key: 'environment-manager', title: 'Manager' }
      ]
    },
    {
      key: 'request',
      title: 'Request',
      icon: '📝',
      items: [
        { key: 'booking-request', title: 'Booking Request' },
        { key: 'change-request', title: 'Change Request' }
      ]
    },
    {
      key: 'deployment',
      title: 'Deployment',
      icon: '🚀',
      items: [
        { key: 'deployment-manager', title: 'Manager' }
      ]
    }
  ];

  const renderContent = () => {
    const contentMap = {
      'welcome': {
        title: 'Welcome to Release Management!',
        description: 'Select a menu item from the left panel to get started.'
      },
      'release-manager': {
        title: 'Release Manager',
        description: 'Manage your software releases here.'
      },
      'environment-manager': {
        title: 'Environment Manager',
        description: 'Manage your deployment environments here.'
      },
      'booking-request': {
        title: 'Booking Request',
        description: 'Create and manage booking requests here.'
      },
      'change-request': {
        title: 'Change Request',
        description: 'Create and manage change requests here.'
      },
      'deployment-manager': {
        title: 'Deployment Manager',
        description: 'Manage your deployments here.'
      }
    };

    const content = contentMap[activeContent] || contentMap['welcome'];

    return (
      <div className="content-placeholder">
        <h2>{content.title}</h2>
        <p>{content.description}</p>
        <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
          Content will be implemented here...
        </div>
      </div>
    );
  };

  return (
    <div className="home-layout">
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>🎉 Welcome!</h2>
            <p>Welcome to Release Management App!</p>
            <button 
              className="modal-close-btn"
              onClick={() => setShowWelcomeModal(false)}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Top Panel */}
      <div className="top-panel">
        <h1 className="app-title">Release Management</h1>
        <div className="account-menu">
          <button 
            className="account-button"
            onMouseEnter={() => setShowAccountDropdown(true)}
            onMouseLeave={() => setShowAccountDropdown(false)}
          >
            👤 {user?.email}
          </button>
          {showAccountDropdown && (
            <div 
              className="account-dropdown"
              onMouseEnter={() => setShowAccountDropdown(true)}
              onMouseLeave={() => setShowAccountDropdown(false)}
            >
              <button onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel */}
        <div className={`left-panel ${leftPanelExpanded ? 'expanded' : 'collapsed'}`}>
          <button className="toggle-btn" onClick={toggleLeftPanel}>
            {leftPanelExpanded ? '◀' : '▶'}
          </button>
          
          <ul className="nav-menu">
            {menuItems.map((menu) => (
              <li key={menu.key} className="nav-item">
                <button 
                  className="nav-header"
                  onClick={() => toggleMenu(menu.key)}
                >
                  <span className="nav-icon">{menu.icon}</span>
                  {leftPanelExpanded && (
                    <>
                      <span className="nav-text">{menu.title}</span>
                      <span className={`nav-arrow ${expandedMenus[menu.key] ? 'expanded' : ''}`}>
                        ▶
                      </span>
                    </>
                  )}
                </button>
                
                {leftPanelExpanded && (
                  <div className={`nav-subitems ${expandedMenus[menu.key] ? 'expanded' : 'collapsed'}`}>
                    {menu.items.map((item) => (
                      <button
                        key={item.key}
                        className="nav-subitem"
                        onClick={() => setActiveContent(item.key)}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Home;