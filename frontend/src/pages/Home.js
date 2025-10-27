import React, { useState } from 'react';
import { useAuth } from '../App';
import ReleaseManager from './ReleaseManager';
import ReleaseDetail from './ReleaseDetail';
import SystemManager from './SystemManager';
import SystemDetail from './SystemDetail';
import SystemForm from './SystemForm';

const Home = () => {
  const { user, logout } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeContent, setActiveContent] = useState('welcome');
  const [selectedReleaseId, setSelectedReleaseId] = useState(null);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [parentSystemId, setParentSystemId] = useState(null);

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

  const handleMenuItemClick = (itemKey) => {
    setActiveContent(itemKey);
    setSelectedReleaseId(null); // Reset release selection when switching menus
    setSelectedSystemId(null); // Reset system selection when switching menus
    setParentSystemId(null); // Reset parent system selection when switching menus
  };

  const handleReleaseNavigation = (releaseId) => {
    setActiveContent('release-detail');
    setSelectedReleaseId(releaseId);
  };

  const handleBackToReleaseManager = () => {
    setActiveContent('release-manager');
    setSelectedReleaseId(null);
  };

  const handleSystemNavigation = (systemId) => {
    if (systemId === 'new') {
      setActiveContent('system-form');
      setSelectedSystemId('new');
      setParentSystemId(null);
    } else if (systemId && systemId.includes('/edit')) {
      setActiveContent('system-form');
      setSelectedSystemId(systemId.replace('/edit', ''));
      setParentSystemId(null);
    } else {
      setActiveContent('system-detail');
      setSelectedSystemId(systemId);
      setParentSystemId(null);
    }
  };

  const handleSubsystemNavigation = (subsystemId, parentId = null) => {
    if (subsystemId === 'new') {
      setActiveContent('system-form');  
      setSelectedSystemId('new');
      setParentSystemId(parentId);
    } else if (subsystemId && subsystemId.includes('/edit')) {
      setActiveContent('system-form');
      setSelectedSystemId(subsystemId.replace('/edit', ''));
      setParentSystemId(null);
    } else {
      setActiveContent('system-detail');
      setSelectedSystemId(subsystemId);
      setParentSystemId(null);
    }
  };

  const handleBackToSystemManager = () => {
    setActiveContent('system-manager');
    setSelectedSystemId(null);
    setParentSystemId(null);
  };

  const menuItems = [
    {
      key: 'release',
      title: 'Release',
      icon: '📋',
      items: [
        { key: 'release-manager', title: 'Manager' },
        { key: 'system-manager', title: 'Systems' }
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
    switch (activeContent) {
      case 'release-manager':
        return (
          <ReleaseManager 
            embedded={true} 
            onNavigateToDetail={handleReleaseNavigation}
          />
        );
      
      case 'release-detail':
        return (
          <ReleaseDetail 
            releaseId={selectedReleaseId}
            embedded={true}
            onBack={handleBackToReleaseManager}
          />
        );
      
      case 'system-manager':
        return (
          <SystemManager 
            embedded={true} 
            onNavigateToDetail={handleSystemNavigation}
          />
        );
      
      case 'system-detail':
        return (
          <SystemDetail 
            systemId={selectedSystemId}
            embedded={true}
            onBack={handleBackToSystemManager}
            onNavigateToSubsystem={handleSubsystemNavigation}
          />
        );
      
      case 'system-form':
        return (
          <SystemForm 
            systemId={selectedSystemId}
            parentSystemId={parentSystemId}
            embedded={true}
            onBack={handleBackToSystemManager}
          />
        );
      
      case 'environment-manager':
        return (
          <div className="content-placeholder">
            <h2>Environment Manager</h2>
            <p>Manage your deployment environments here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Content will be implemented here...
            </div>
          </div>
        );
      
      case 'booking-request':
        return (
          <div className="content-placeholder">
            <h2>Booking Request</h2>
            <p>Create and manage booking requests here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Content will be implemented here...
            </div>
          </div>
        );
      
      case 'change-request':
        return (
          <div className="content-placeholder">
            <h2>Change Request</h2>
            <p>Create and manage change requests here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Content will be implemented here...
            </div>
          </div>
        );
      
      case 'deployment-manager':
        return (
          <div className="content-placeholder">
            <h2>Deployment Manager</h2>
            <p>Manage your deployments here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Content will be implemented here...
            </div>
          </div>
        );
      
      default:
        return (
          <div className="content-placeholder">
            <h2>Welcome to Release Management!</h2>
            <p>Select a menu item from the left panel to get started.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Choose from the navigation menu to begin managing your releases, environments, and requests.
            </div>
          </div>
        );
    }
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
                        onClick={() => handleMenuItemClick(item.key)}
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