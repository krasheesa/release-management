import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { systemService, buildService, releaseService } from '../services/api';
import './SystemDetail.css';

const SystemDetail = ({ systemId, embedded = false, onBack, onNavigateToSubsystem }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentSystemId = systemId || id;
  
  const [system, setSystem] = useState(null);
  const [subsystems, setSubsystems] = useState([]);
  const [systemBuilds, setSystemBuilds] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedSubsystems, setExpandedSubsystems] = useState({});
  const [subsystemBuilds, setSubsystemBuilds] = useState({});
  const [buildSearchTerm, setBuildSearchTerm] = useState('');
  const [buildSortBy, setBuildSortBy] = useState('build_date');
  const [buildSortOrder, setBuildSortOrder] = useState('desc');
  const [subsystemSortBy, setSubsystemSortBy] = useState('name');
  const [subsystemSortOrder, setSubsystemSortOrder] = useState('asc');

  useEffect(() => {
    if (currentSystemId && currentSystemId !== 'new') {
      loadSystemDetails();
    }
  }, [currentSystemId]);

  const loadSystemDetails = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [systemData, subsystemsData, allBuilds, releasesData] = await Promise.all([
        systemService.getSystem(currentSystemId),
        systemService.getSubsystems(currentSystemId),
        buildService.getAllBuilds(),
        releaseService.getAllReleases()
      ]);
      
      setSystem(systemData);
      setSubsystems(subsystemsData);
      setReleases(releasesData);
      
      // Filter builds for this system and enrich with release data
      const systemSpecificBuilds = allBuilds
        .filter(build => build.system_id === currentSystemId)
        .map(build => ({
          ...build,
          release: releasesData.find(release => release.id === build.release_id)
        }));
      
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
      let aValue = a[subsystemSortBy] || '';
      let bValue = b[subsystemSortBy] || '';
      
      // Handle date sorting
      if (subsystemSortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      
      if (subsystemSortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBuildSort = (field) => {
    if (buildSortBy === field) {
      setBuildSortOrder(buildSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBuildSortBy(field);
      setBuildSortOrder('asc');
    }
  };

  const handleSubsystemSort = (field) => {
    if (subsystemSortBy === field) {
      setSubsystemSortOrder(subsystemSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSubsystemSortBy(field);
      setSubsystemSortOrder('asc');
    }
  };

  const getBuildSortIcon = (field) => {
    if (buildSortBy !== field) return '⇅';
    return buildSortOrder === 'asc' ? '↑' : '↓';
  };

  const getSubsystemSortIcon = (field) => {
    if (subsystemSortBy !== field) return '⇅';
    return subsystemSortOrder === 'asc' ? '↑' : '↓';
  };

  // Filter and sort builds
  const filteredAndSortedBuilds = systemBuilds
    .filter(build => 
      build.version.toLowerCase().includes(buildSearchTerm.toLowerCase()) ||
      (build.release?.name || '').toLowerCase().includes(buildSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (buildSortBy) {
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        case 'release':
          aValue = a.release?.name || '';
          bValue = b.release?.name || '';
          break;
        case 'build_date':
          aValue = new Date(a.build_date);
          bValue = new Date(b.build_date);
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[buildSortBy] || '';
          bValue = b[buildSortBy] || '';
      }
      
      if (aValue < bValue) return buildSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return buildSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

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
          Edit System
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
              <label>Type:</label>
              <span className="system-type-info">
                {system.type === 'parent_systems' ? 'Parent System' :
                 system.type === 'subsystems' ? 'Subsystem' :
                 system.type === 'systems' ? 'System' : 'System'}
              </span>
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
            <div className="info-item">
              <label>Status:</label>
              <span>
                {system.status === 'active' ? 'Active' :
                 system.status === 'deprecated' ? 'Deprecated' : 'System'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Builds Section - Only show for systems and subsystems, not parent_systems */}
      {system.type !== 'parent_systems' && (
        <div className="builds-section">
          <div className="builds-header">
            <h2>Associated Builds ({systemBuilds.length})</h2>
          </div>

          {systemBuilds.length > 0 && (
            <div className="builds-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by version or release..."
                  value={buildSearchTerm}
                  onChange={(e) => setBuildSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          )}

          {systemBuilds.length > 0 ? (
            <div className="builds-table-container">
              {filteredAndSortedBuilds.length === 0 ? (
                <div className="no-builds-found">
                  <p>No builds match your search criteria</p>
                </div>
              ) : (
                <table className="builds-table">
                  <thead>
                    <tr>
                      <th 
                        onClick={() => handleBuildSort('version')}
                        className="sortable"
                      >
                        Version {getBuildSortIcon('version')}
                      </th>
                      <th 
                        onClick={() => handleBuildSort('release')}
                        className="sortable"
                      >
                        Release {getBuildSortIcon('release')}
                      </th>
                      <th 
                        onClick={() => handleBuildSort('build_date')}
                        className="sortable"
                      >
                        Build Date {getBuildSortIcon('build_date')}
                      </th>
                      <th 
                        onClick={() => handleBuildSort('created_at')}
                        className="sortable"
                      >
                        Created Date {getBuildSortIcon('created_at')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedBuilds.map(build => (
                      <tr key={build.id} className="build-row">
                        <td className="version-cell">
                          <span className="version-badge">{build.version}</span>
                        </td>
                        <td className="release-cell">
                          {build.release?.name || (
                            <span className="no-release">No Release</span>
                          )}
                        </td>
                        <td className="date-cell">
                          {formatDateTime(build.build_date)}
                        </td>
                        <td className="date-cell">
                          {formatDateTime(build.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="empty-builds">
              <p>No builds associated with this {system.type === 'subsystems' ? 'subsystem' : 'system'}</p>
            </div>
          )}
        </div>
      )}

      {/* Subsystems Section - Only show for parent systems */}
      {system.type === 'parent_systems' && (
        <div className="subsystems-section">
          <div className="subsystems-header">
            <h2>Subsystems ({subsystems.length})</h2>
            <button onClick={handleCreateSubsystem} className="create-subsystem-btn">
              + Create Subsystem
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
              <div className="associated-subsystems">
                {filteredAndSortedSubsystems ? (
                  filteredAndSortedSubsystems.length > 0 ? (
                    <table className="subsystems-sub-table">
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleSubsystemSort('name')}
                            className="sortable"
                          >
                            Name {getSubsystemSortIcon('name')}
                          </th>
                          <th>Description</th>
                          <th
                            onClick={() => handleSubsystemSort('status')}
                            className="sortable"
                          >
                            Status {getSubsystemSortIcon('status')}
                          </th>
                          <th
                            onClick={() => handleSubsystemSort('created_at')}
                            className="sortable"
                          >
                            Created At {getSubsystemSortIcon('created_at')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedSubsystems.map(subsystem => (
                          <tr key={subsystem.id}>
                            <td>
                              <button
                                className="system-name-link"
                                onClick={() => handleSubsystemClick(subsystem.id)}
                                title="Edit subsystem"
                              >
                                {subsystem.name}
                              </button>
                            </td>
                            <td>{subsystem.description}</td>
                            <td className="status-cell"><span className="status-badge status-active">{subsystem.status}</span></td>
                            <td>{formatDate(subsystem.created_at)}</td>
                            <td className="action-cell">
                              <div className="action-buttons">
                                <button
                                  onClick={() => handleSubsystemClick(subsystem.id)}
                                  className="action-btn edit-btn"
                                  title="Edit Subsystem"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSubsystem(subsystem.id, e)}
                                  className="action-btn delete-btn"
                                  title="Delete Subsystem"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-subsystems">No subsystems for this system</div>
                  )
                ) : (
                  <div className="loading-subsystems">Loading subsystems...</div>
                )}
              </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default SystemDetail;