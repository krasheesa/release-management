import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReleaseManager from './ReleaseManager';
import ReleaseDetail from './ReleaseDetail';
import SystemManager from './SystemManager';
import SystemDetail from './SystemDetail';
import SystemForm from './SystemForm';
import BuildManager from './BuildManager';
import BuildForm from './BuildForm';

const Home = ({ activeContent: propActiveContent }) => {
  const { user, logout, justLoggedIn, setJustLoggedIn } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeContent, setActiveContent] = useState(propActiveContent || 'welcome');
  const [selectedReleaseId, setSelectedReleaseId] = useState(params.id || null);
  const [selectedSystemId, setSelectedSystemId] = useState(params.id || null);
  const [selectedBuildId, setSelectedBuildId] = useState(params.id || null);
  const [parentSystemId, setParentSystemId] = useState(null);

  // Handle welcome modal logic
  useEffect(() => {
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (justLoggedIn && !welcomeShown) {
      setShowWelcomeModal(true);
      setJustLoggedIn(false);
    }
  }, [justLoggedIn, setJustLoggedIn]);

  // Update active content based on route
  useEffect(() => {
    if (propActiveContent) {
      setActiveContent(propActiveContent);
      
      // Auto-expand relevant menu based on active content
      if (propActiveContent.includes('release') || propActiveContent.includes('build') || propActiveContent.includes('system')) {
        setExpandedMenus(prev => ({
          ...prev,
          'release': true
        }));
      } else if (propActiveContent.includes('environment')) {
        setExpandedMenus(prev => ({
          ...prev,
          'environment': true
        }));
      } else if (propActiveContent.includes('request')) {
        setExpandedMenus(prev => ({
          ...prev,
          'request': true
        }));
      } else if (propActiveContent.includes('deployment')) {
        setExpandedMenus(prev => ({
          ...prev,
          'deployment': true
        }));
      }
    }
    if (params.id) {
      if (propActiveContent === 'release-detail') {
        setSelectedReleaseId(params.id);
      } else if (propActiveContent === 'system-detail' || propActiveContent === 'system-form') {
        setSelectedSystemId(params.id);
      } else if (propActiveContent === 'build-form') {
        setSelectedBuildId(params.id);
      }
    } else if (propActiveContent === 'build-form' && location.pathname === '/builds/new') {
      // Reset build ID when creating new build
      setSelectedBuildId('new');
    } else if (propActiveContent === 'system-form' && location.pathname === '/systems/new') {
      // Reset system ID when creating new system
      setSelectedSystemId('new');
    }
    
    // Handle parentSystemId from location state for subsystem creation
    if (propActiveContent === 'system-form' && location.state?.parentSystemId) {
      setParentSystemId(location.state.parentSystemId);
    } else if (propActiveContent !== 'system-form') {
      // Clear parentSystemId when not in system form
      setParentSystemId(null);
    }
  }, [propActiveContent, params.id, location.state?.parentSystemId]);

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
    const routeMap = {
      'home': '/dashboard',
      'release-manager': '/release-manager',
      'build-manager': '/build-manager',
      'system-manager': '/systems',
      'environment-manager': '/environment-manager',
      'maintenance-request': '/maintenance-request',
      'change-request': '/change-request',
      'deployment-manager': '/deployment-manager'
    };
    
    if (routeMap[itemKey]) {
      navigate(routeMap[itemKey]);
    } else {
      setActiveContent(itemKey);
    }
  };

  const handleReleaseNavigation = (releaseId) => {
    navigate(`/releases/${releaseId}`);
  };

  const handleBackToReleaseManager = () => {
    navigate('/release-manager');
  };

  const handleSystemNavigation = (systemId) => {
    if (systemId === 'new') {
      navigate('/systems/new');
    } else if (systemId && systemId.includes('/edit')) {
      const id = systemId.replace('/edit', '');
      navigate(`/systems/${id}/edit`);
    } else {
      navigate(`/systems/${systemId}`);
    }
  };

  const handleSubsystemNavigation = (subsystemId, parentId = null) => {
    if (subsystemId === 'new') {
      navigate('/systems/new', { state: { parentSystemId: parentId } });
    } else if (subsystemId && subsystemId.includes('/edit')) {
      const id = subsystemId.replace('/edit', '');
      navigate(`/systems/${id}/edit`);
    } else {
      navigate(`/systems/${subsystemId}`);
    }
  };

  const handleBackToSystemManager = () => {
    navigate('/systems');
  };

  const handleBuildNavigation = (buildId) => {
    if (buildId === 'new') {
      navigate('/builds/new');
    } else if (buildId && buildId.includes('/edit')) {
      const id = buildId.replace('/edit', '');
      navigate(`/builds/${id}/edit`);
    } else {
      navigate(`/builds/${buildId}`);
    }
  };

  const handleBackToBuildManager = () => {
    navigate('/build-manager');
  };

  const menuSections = [
    {
      title: 'Discover',
      items: [
        { key: 'home', title: 'Home' }
      ]
    },
    {
      title: 'Service',
      items: [
        { key: 'release', title: 'Release', hasSubitems: true, subitems: [
          { key: 'release-manager', title: 'Manager' },
          { key: 'build-manager', title: 'Build' },
          { key: 'system-manager', title: 'Systems' }
        ]},
        { key: 'environment', title: 'Environment', hasSubitems: true, subitems: [
          { key: 'environment-manager', title: 'Manager' }
        ]},
        { key: 'request', title: 'Request', hasSubitems: true, subitems: [
          { key: 'change-request', title: 'Change Request' },
          { key: 'maintenance-request', title: 'Maintenance Request' }
        ]},
        { key: 'deployment', title: 'Deployment', hasSubitems: true, subitems: [
          { key: 'deployment-manager', title: 'Manager' }
        ]}
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
      
      case 'build-manager':
        return (
          <BuildManager 
            embedded={true} 
            onNavigateToDetail={handleBuildNavigation}
          />
        );
      
      case 'build-form':
        return (
          <BuildForm 
            buildId={selectedBuildId}
            embedded={true}
            onBack={handleBackToBuildManager}
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
              Feature are still WIP. Soon to come!
            </div>
          </div>
        );
      
      case 'maintenance-request':
        return (
          <div className="content-placeholder">
            <h2>Maintenance Request</h2>
            <p>Create and manage maintenance requests here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Feature are still WIP. Soon to come!
            </div>
          </div>
        );
      
      case 'change-request':
        return (
          <div className="content-placeholder">
            <h2>Change Request</h2>
            <p>Create and manage change requests here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Feature are still WIP. Soon to come!
            </div>
          </div>
        );
      
      case 'deployment-manager':
        return (
          <div className="content-placeholder">
            <h2>Deployment Manager</h2>
            <p>Manage your deployments here.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Feature are still WIP. Soon to come!
            </div>
          </div>
        );
      
      case 'home':
      case 'welcome':
        return (
          <div className="content-placeholder">
            <h2>Welcome to Release Management!</h2>
            <p>Select a menu item from the left panel to get started.</p>
            <div style={{ color: '#adb5bd', fontSize: '14px', marginTop: '20px' }}>
              Choose from the navigation menu to begin managing your releases, environments, and requests.
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
            <h2>Welcome!</h2>
            <p>Welcome to Release Management App!</p>
            <button 
              className="modal-close-btn"
              onClick={() => {
                setShowWelcomeModal(false);
                localStorage.setItem('welcomeShown', 'true');
              }}
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
            <div className="toggle-icon">
              {leftPanelExpanded ? (
                <span>&lt;</span>
              ) : (
                <div className="hamburger-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </button>
          
          <ul className="nav-menu">
            {leftPanelExpanded && menuSections.map((section) => (
              <div key={section.title}>
                <div className="nav-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <li key={item.key} className="nav-item">
                    {item.hasSubitems ? (
                      <>
                        <button 
                          className="nav-header"
                          onClick={() => toggleMenu(item.key)}
                        >
                          <span className="nav-text">{item.title}</span>
                          <span className={`nav-arrow ${expandedMenus[item.key] ? 'expanded' : ''}`}>
                            ▶
                          </span>
                        </button>
                        
                        <div className={`nav-subitems ${expandedMenus[item.key] ? 'expanded' : 'collapsed'}`}>
                          {item.subitems.map((subitem) => (
                            <button
                              key={subitem.key}
                              className={`nav-subitem ${activeContent === subitem.key ? 'active' : ''}`}
                              onClick={() => handleMenuItemClick(subitem.key)}
                            >
                              {subitem.title}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <button 
                        className={`nav-header ${activeContent === item.key ? 'active' : ''}`}
                        onClick={() => handleMenuItemClick(item.key)}
                      >
                        <span className="nav-text">{item.title}</span>
                      </button>
                    )}
                  </li>
                ))}
              </div>
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