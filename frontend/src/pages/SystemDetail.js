import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { systemService, buildService } from '../services/api';
import './SystemDetail.css';

const SystemDetail = ({ systemId, embedded = false, onBack, onNavigateToSubsystem }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentSystemId = systemId || id;
  
  const [system, setSystem] = useState(null);
  const [subsystems, setSubsystems] = useState([]);
  const [systemBuilds, setSystemBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedSubsystems, setExpandedSubsystems] = useState({});
  const [subsystemBuilds, setSubsystemBuilds] = useState({});

  useEffect(() => {
    if (currentSystemId && currentSystemId !== 'new') {
      loadSystemDetails();
    }
  }, [currentSystemId]);

  const loadSystemDetails = async () => {
    try {
      setLoading(true);
      
      // Load system details
      const systemData = await systemService.getSystem(currentSystemId);
      setSystem(systemData);
      
      // Load subsystems
      const subsystemsData = await systemService.getSubsystems(currentSystemId);
      setSubsystems(subsystemsData);
      
      // Load system builds
      const allBuilds = await buildService.getAllBuilds();
      const systemSpecificBuilds = allBuilds.filter(build => build.system_id === currentSystemId);
      setSystemBuilds(systemSpecificBuilds);
      
      setError(null);
    } catch (err) {
      setError('Failed to load system details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubsystemBuilds = async (subsystemId) => {
    try {
      const allBuilds = await buildService.getAllBuilds();
      const subsystemSpecificBuilds = allBuilds.filter(build => build.system_id === subsystemId);
      setSubsystemBuilds(prev => ({
        ...prev,
        [subsystemId]: subsystemSpecificBuilds
      }));
    } catch (err) {
      console.error('Failed to load builds for subsystem:', err);
    }
  };

  const toggleSubsystemExpansion = (subsystemId) => {
    const isExpanded = expandedSubsystems[subsystemId];
    
    setExpandedSubsystems(prev => ({
      ...prev,
      [subsystemId]: !isExpanded
    }));

    // Load builds if expanding and not already loaded
    if (!isExpanded && !subsystemBuilds[subsystemId]) {
      loadSubsystemBuilds(subsystemId);
    }
  };

  const handleSubsystemClick = (subsystemId) => {
    if (embedded && onNavigateToSubsystem) {
      onNavigateToSubsystem(subsystemId);
    } else {
      navigate(`/systems/${subsystemId}`);
    }
  };

  const handleCreateSubsystem = () => {
    if (embedded && onNavigateToSubsystem) {
      onNavigateToSubsystem('new', currentSystemId); // Pass parent system ID
    } else {
      navigate(`/systems/new?parent=${currentSystemId}`);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/systems');
    }
  };

  const handleDeleteSubsystem = async (subsystemId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this subsystem?')) {
      try {
        await systemService.deleteSystem(subsystemId);
        loadSystemDetails(); // Reload the details
      } catch (err) {
        alert('Failed to delete subsystem: ' + err.message);
      }
    }
  };

  // Filter and sort subsystems
  const filteredAndSortedSubsystems = subsystems
    .filter(subsystem => 
      subsystem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subsystem.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Handle date sorting
      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="system-detail">
        <div className="loading-spinner">Loading system details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-detail">
        <div className="error-message">
          {error}
          <button onClick={loadSystemDetails} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="system-detail">
        <div className="error-message">
          System not found
          <button onClick={handleBack} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-detail">
      <div className="system-detail-header">
        <div className="header-left">
          <button onClick={handleBack} className="back-btn">
            ← Back to Systems
          </button>
          <div className="system-title">
            <h1>{system.name}</h1>
            <span className="system-type">System</span>
          </div>
        </div>
        <button 
          onClick={() => {
            if (embedded && onNavigateToSubsystem) {
              onNavigateToSubsystem(currentSystemId + '/edit');
            } else {
              navigate(`/systems/${currentSystemId}/edit`);
            }
          }}
          className="edit-system-btn"
        >
          ✏️ Edit System
        </button>
      </div>

      <div className="system-info-section">
        <div className="system-info-card">
          <h2>System Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{system.name}</span>
            </div>
            <div className="info-item">
              <label>Description:</label>
              <span>{system.description || 'No description provided'}</span>
            </div>
            <div className="info-item">
              <label>Created:</label>
              <span>{formatDate(system.created_at)}</span>
            </div>
            <div className="info-item">
              <label>System ID:</label>
              <span className="system-id">{system.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Builds Section */}
      <div className="builds-section">
        <h2>Associated Builds ({systemBuilds.length})</h2>
        {systemBuilds.length > 0 ? (
          <div className="builds-grid">
            {systemBuilds.map(build => (
              <div key={build.id} className="build-card">
                <div className="build-header">
                  <h3>{build.system?.name || 'Unknown System'}</h3>
                  <span className="build-version">v{build.version}</span>
                </div>
                <div className="build-info">
                  <div className="build-meta">
                    <span className="build-date">
                      📅 {formatDate(build.build_date)}
                    </span>
                    <span className="build-release">
                      📦 {build.release?.name || 'No Release'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-builds">
            <p>No builds associated with this system</p>
          </div>
        )}
      </div>

      {/* Subsystems Section - Only show for root systems */}
      {!system.parent_id && (
        <div className="subsystems-section">
          <div className="subsystems-header">
            <h2>Subsystems ({subsystems.length})</h2>
            <button onClick={handleCreateSubsystem} className="create-subsystem-btn">
              ➕ Create Subsystem
            </button>
          </div>

        <div className="subsystem-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search subsystems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="created_at">Sort by Created Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>

        <div className="subsystems-list">
          {filteredAndSortedSubsystems.length === 0 ? (
            <div className="empty-state">
              <h3>No subsystems found</h3>
              <p>Create a subsystem for this system to get started!</p>
              <button onClick={handleCreateSubsystem} className="create-subsystem-btn">
                Create Subsystem
              </button>
            </div>
          ) : (
            filteredAndSortedSubsystems.map(subsystem => (
              <div key={subsystem.id} className="subsystem-card">
                <div 
                  className="subsystem-header"
                  onClick={() => toggleSubsystemExpansion(subsystem.id)}
                >
                  <div className="subsystem-info">
                    <div className="subsystem-title">
                      <h3>{subsystem.name}</h3>
                    </div>
                    <p className="subsystem-description">{subsystem.description}</p>
                    <div className="subsystem-meta">
                      <span className="subsystem-date">
                        📅 {formatDate(subsystem.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="subsystem-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubsystemClick(subsystem.id);
                      }}
                      className="view-btn"
                      title="View Subsystem"
                    >
                      👁️
                    </button>
                    <button
                      onClick={(e) => handleDeleteSubsystem(subsystem.id, e)}
                      className="delete-btn"
                      title="Delete Subsystem"
                    >
                      🗑️
                    </button>
                    <button className="expand-btn">
                      {expandedSubsystems[subsystem.id] ? '▼' : '▶️'}
                    </button>
                  </div>
                </div>

                {expandedSubsystems[subsystem.id] && (
                  <div className="subsystem-builds">
                    <h4>Associated Builds</h4>
                    {subsystemBuilds[subsystem.id] ? (
                      subsystemBuilds[subsystem.id].length > 0 ? (
                        <div className="builds-list">
                          {subsystemBuilds[subsystem.id].map(build => (
                            <div key={build.id} className="build-item">
                              <div className="build-info">
                                <strong>{build.system?.name || 'Unknown System'}</strong>
                                <span className="build-version">v{build.version}</span>
                              </div>
                              <div className="build-meta">
                                <span className="build-date">
                                  {formatDate(build.build_date)}
                                </span>
                                <span className="build-release">
                                  📦 {build.release?.name || 'No Release'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-builds">No builds associated with this subsystem</p>
                      )
                    ) : (
                      <p className="loading-builds">Loading builds...</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default SystemDetail;