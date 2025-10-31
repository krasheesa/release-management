import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemService, buildService } from '../services/api';
import './SystemManager.css';

const SystemManager = ({ embedded = false, onNavigateToDetail }) => {
  const navigate = useNavigate();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('root'); // Default to root systems only
  const [expandedSystems, setExpandedSystems] = useState({});
  const [systemSubsystems, setSystemSubsystems] = useState({});

  // Load systems on component mount
  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      setLoading(true);
      const data = await systemService.getAllSystems();
      setSystems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load systems: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemSubsystems = async (systemId) => {
    try {
      // Get subsystems for this system
      const subsystems = await systemService.getSubsystems(systemId);
      setSystemSubsystems(prev => ({
        ...prev,
        [systemId]: subsystems
      }));
    } catch (err) {
      console.error('Failed to load subsystems for system:', err);
    }
  };

  const toggleSystemExpansion = (systemId) => {
    const isExpanded = expandedSystems[systemId];
    
    setExpandedSystems(prev => ({
      ...prev,
      [systemId]: !isExpanded
    }));

    // Load subsystems if expanding and not already loaded
    if (!isExpanded && !systemSubsystems[systemId]) {
      loadSystemSubsystems(systemId);
    }
  };

  const handleSystemClick = (systemId) => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail(systemId);
    } else {
      navigate(`/systems/${systemId}`);
    }
  };

  const handleCreateSystem = () => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail('new');
    } else {
      navigate('/systems/new');
    }
  };

  const handleDeleteSystem = async (systemId, e) => {
    e.stopPropagation();
    
    // Check if system has subsystems
    const subsystems = systems.filter(s => s.parent_id === systemId);
    if (subsystems.length > 0) {
      alert('Cannot delete system with subsystems. Please delete subsystems first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this system?')) {
      try {
        await systemService.deleteSystem(systemId);
        loadSystems(); // Reload the list
      } catch (err) {
        alert('Failed to delete system: ' + err.message);
      }
    }
  };

  // Filter and sort systems
  const filteredAndSortedSystems = systems
    .filter(system => {
      // Type filter
      if (typeFilter === 'all') {
        return true; // Show all types
      } else if (typeFilter === 'root') {
        return system.type !== 'subsystems'; // Show parent_systems and systems only
      } else {
        return system.type === typeFilter; // Show specific type
      }
    })
    .filter(system => 
      system.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getSystemType = (system) => {
    if (system.type === 'parent_systems') return 'Parent System';
    if (system.type === 'subsystems') return 'Subsystem';
    if (system.type === 'systems') return 'System';
    
    // Fallback for systems without type field (backward compatibility)
    const hasSubsystems = systems.some(s => s.parent_id === system.id);
    return hasSubsystems ? 'Parent System' : 'System';
  };

  const getParentSystemName = (parentId) => {
    const parent = systems.find(s => s.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  const getSystemCounts = () => {
    const counts = {
      all: systems.length,
      root: systems.filter(s => s.type !== 'subsystems').length,
      parent_systems: systems.filter(s => s.type === 'parent_systems').length,
      systems: systems.filter(s => s.type === 'systems').length,
      subsystems: systems.filter(s => s.type === 'subsystems').length
    };
    return counts;
  };

  const systemCounts = getSystemCounts();

  if (loading) {
    return (
      <div className="system-manager">
        <div className="loading-spinner">Loading systems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-manager">
        <div className="error-message">
          {error}
          <button onClick={loadSystems} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-manager">
      <div className="system-manager-header">
        <div className="header-left">
          <h1>System Manager</h1>
          <div className="results-info">
            {typeFilter === 'all' ? 
              `Showing ${filteredAndSortedSystems.length} of ${systems.length} systems` :
              `Showing ${filteredAndSortedSystems.length} ${typeFilter.replace('_', ' ')} ${filteredAndSortedSystems.length === 1 ? 'system' : 'systems'}`
            }
          </div>
        </div>
        <button onClick={handleCreateSystem} className="create-system-btn">
          ➕ Create New System
        </button>
      </div>

      <div className="system-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search systems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <label htmlFor="type-filter" className="filter-label">Filter by Type:</label>
                    <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="root">Default ({systemCounts.root})</option>
            <option value="all">All Systems ({systemCounts.all})</option>
            <option value="parent_systems">Parent Systems ({systemCounts.parent_systems})</option>
            <option value="systems">Systems ({systemCounts.systems})</option>
            <option value="subsystems">Subsystems ({systemCounts.subsystems})</option>
          </select>
          {typeFilter !== 'root' && (
            <button
              onClick={() => setTypeFilter('root')}
              className="clear-filter-btn"
              title="Reset to default filter"
            >
              ✕
            </button>
          )}
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

      <div className="systems-list">
        {filteredAndSortedSystems.length === 0 ? (
          <div className="empty-state">
            <h3>No systems found</h3>
            <p>Create your first system to get started!</p>
            <button onClick={handleCreateSystem} className="create-system-btn">
              Create System
            </button>
          </div>
        ) : (
          filteredAndSortedSystems.map(system => (
            <div key={system.id} className="system-card">
              <div 
                className="system-header"
                onClick={() => toggleSystemExpansion(system.id)}
              >
                <div className="system-info">
                  <div className="system-title">
                    <h3>{system.name}</h3>
                    <span className="system-type">{getSystemType(system)}</span>
                  </div>
                  <p className="system-description">{system.description}</p>
                  <div className="system-meta">
                    <span className="system-date">
                      📅 {formatDate(system.created_at)}
                    </span>
                    {system.parent_id && (
                      <span className="parent-system">
                        🔗 Parent: {getParentSystemName(system.parent_id)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="system-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSystemClick(system.id);
                    }}
                    className="view-btn"
                    title="View System"
                  >
                    👁️
                  </button>
                  <button
                    onClick={(e) => handleDeleteSystem(system.id, e)}
                    className="delete-btn"
                    title="Delete System"
                  >
                    🗑️
                  </button>
                  <button className="expand-btn">
                    {expandedSystems[system.id] ? '▼' : '▶️'}
                  </button>
                </div>
              </div>

              {expandedSystems[system.id] && (
                <div className="system-subsystems">
                  <h4>Subsystems</h4>
                  {systemSubsystems[system.id] ? (
                    systemSubsystems[system.id].length > 0 ? (
                      <div className="subsystems-list">
                        {systemSubsystems[system.id].map(subsystem => (
                          <div key={subsystem.id} className="subsystem-item">
                            <div className="subsystem-info">
                              <strong>{subsystem.name}</strong>
                              <p className="subsystem-description">{subsystem.description}</p>
                            </div>
                            <div className="subsystem-meta">
                              <span className="subsystem-date">
                                📅 {formatDate(subsystem.created_at)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSystemClick(subsystem.id);
                                }}
                                className="view-subsystem-btn"
                                title="View Subsystem"
                              >
                                👁️ View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-subsystems">No subsystems for this system</p>
                    )
                  ) : (
                    <p className="loading-subsystems">Loading subsystems...</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemManager;