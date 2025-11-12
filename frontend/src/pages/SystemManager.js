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
  // Load sorting from localStorage or default values
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('systemManager_sortBy') || 'name';
  });
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('systemManager_sortOrder') || 'asc';
  });
  // Load filter from localStorage or default to 'root'
  const [typeFilter, setTypeFilter] = useState(() => {
    return localStorage.getItem('systemManager_typeFilter') || 'root';
  });
  // Load column filters from localStorage with migration from old array format
  const [columnFilters, setColumnFilters] = useState(() => {
    const saved = localStorage.getItem('systemManager_columnFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: if old format (arrays), convert to new format (strings)
        if (Array.isArray(parsed.name) || Array.isArray(parsed.type) || Array.isArray(parsed.status)) {
          const migrated = { name: '', type: '', status: '' };
          localStorage.setItem('systemManager_columnFilters', JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      } catch (e) {
        // If parsing fails, reset to defaults
        const defaults = { name: '', type: '', status: '' };
        localStorage.setItem('systemManager_columnFilters', JSON.stringify(defaults));
        return defaults;
      }
    }
    return { name: '', type: '', status: '' };
  });
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  // Load filter search terms from localStorage
  const [filterSearchTerms, setFilterSearchTerms] = useState(() => {
    const saved = localStorage.getItem('systemManager_filterSearchTerms');
    return saved ? JSON.parse(saved) : { name: '', type: '', status: '' };
  });
  const [expandedSystems, setExpandedSystems] = useState({});
  const [systemSubsystems, setSystemSubsystems] = useState({});

  // Load systems on component mount and handle data migration
  useEffect(() => {
    // Clear old localStorage data that might cause conflicts
    const version = localStorage.getItem('systemManager_version');
    if (version !== '2.0') {
      localStorage.removeItem('systemManager_columnFilters');
      localStorage.removeItem('systemManager_filterSearchTerms');
      localStorage.setItem('systemManager_version', '2.0');
      // Reset states to defaults
      setColumnFilters({ name: '', type: '', status: '' });
      setFilterSearchTerms({ name: '', type: '', status: '' });
    }
    
    loadSystems();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeFilterColumn && !event.target.closest('.column-header')) {
        setActiveFilterColumn(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterColumn]);

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

  const handleSystemEdit = (systemId) => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail(`${systemId}/edit`);
    } else {
      navigate(`/systems/${systemId}/edit`);
    }
  };

  const handleCreateSystem = () => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail('new');
    } else {
      navigate('/systems/new');
    }
  };

  // Handle filter change and save to localStorage
  const handleTypeFilterChange = (newFilter) => {
    setTypeFilter(newFilter);
    localStorage.setItem('systemManager_typeFilter', newFilter);
  };

  // Handle sort change and save to localStorage
  const handleSortChange = (newSortBy) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    localStorage.setItem('systemManager_sortBy', newSortBy);
    localStorage.setItem('systemManager_sortOrder', newSortOrder);
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

  // Handle sorting with proper localStorage persistence
  const handleSort = (field) => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    localStorage.setItem('systemManager_sortBy', field);
    localStorage.setItem('systemManager_sortOrder', newSortOrder);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleColumnFilter = (column, value) => {
    const newFilters = {
      ...columnFilters,
      [column]: value
    };
    setColumnFilters(newFilters);
    localStorage.setItem('systemManager_columnFilters', JSON.stringify(newFilters));
    setActiveFilterColumn(null);
  };

  const handleFilterSearch = (column, value) => {
    const newSearchTerms = {
      ...filterSearchTerms,
      [column]: value
    };
    setFilterSearchTerms(newSearchTerms);
    localStorage.setItem('systemManager_filterSearchTerms', JSON.stringify(newSearchTerms));
  };

  const getFilteredOptions = (column) => {
    const searchTerm = filterSearchTerms[column]?.toLowerCase() || '';
    
    if (column === 'name') {
      const existingNames = [...new Set(systems.map(system => system.name).filter(Boolean))];
      return existingNames
        .filter(name => name.toLowerCase().includes(searchTerm))
        .map(name => ({ id: name, name }));
    } else if (column === 'type') {
      const existingTypes = [...new Set(systems.map(system => getSystemType(system)).filter(Boolean))];
      return existingTypes
        .filter(type => type.toLowerCase().includes(searchTerm))
        .map(type => ({ id: type, name: type }));
    } else if (column === 'status') {
      return [{id: 'Active', name: 'Active'}]
        .filter(status => status.name.toLowerCase().includes(searchTerm));
    }
    return [];
  };

  const clearColumnFilter = (column) => {
    const newFilters = {
      ...columnFilters,
      [column]: ''
    };
    const newSearchTerms = {
      ...filterSearchTerms,
      [column]: ''
    };
    setColumnFilters(newFilters);
    setFilterSearchTerms(newSearchTerms);
    localStorage.setItem('systemManager_columnFilters', JSON.stringify(newFilters));
    localStorage.setItem('systemManager_filterSearchTerms', JSON.stringify(newSearchTerms));
  };

  const hasActiveFilter = (column) => {
    return columnFilters[column] !== '';
  };

  // Filter and sort systems
  const filteredAndSortedSystems = systems
    .filter(system => {
      // Search filter
      const matchesSearch = 
        system.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        system.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter (original dropdown)
      let matchesTypeFilter = true;
      if (typeFilter === 'all') {
        matchesTypeFilter = true; // Show all types
      } else if (typeFilter === 'root') {
        matchesTypeFilter = system.type !== 'subsystems'; // Show parent_systems and systems only
      } else {
        matchesTypeFilter = system.type === typeFilter; // Show specific type
      }
      
      // Column-based filters with safety checks
      const matchesColumnNameFilter = !columnFilters?.name || system.name === columnFilters.name;
      const matchesColumnTypeFilter = !columnFilters?.type || getSystemType(system) === columnFilters.type;
      const matchesColumnStatusFilter = !columnFilters?.status || columnFilters.status === 'Active';
      
      return matchesSearch && matchesTypeFilter && matchesColumnNameFilter && matchesColumnTypeFilter && matchesColumnStatusFilter;
    })
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
        </div>
        <button onClick={handleCreateSystem} className="create-system-btn">
          + Create New System
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
            onChange={(e) => handleTypeFilterChange(e.target.value)}
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
              onClick={() => handleTypeFilterChange('root')}
              className="clear-filter-btn"
              title="Reset to default filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="systems-table-container">
        {filteredAndSortedSystems.length === 0 ? (
          <div className="empty-state">
            <h3>No systems found</h3>
            <p>Create your first system to get started!</p>
            <button onClick={handleCreateSystem} className="create-system-btn">
              Create System
            </button>
          </div>
        ) : (
          <table className="systems-table">
            <thead>
              <tr>
                <th className="expand-col"></th>
                <th className="column-header name-col" onClick={() => handleSort('name')}>
                  <div className="header-content">
                    <span className="sortable">System Name {getSortIcon('name')}</span>
                  </div>
                </th>
                <th className="column-header type-col" onClick={() => handleSort('type')}>
                  <div className="header-content">
                    <span className="sortable">Type {getSortIcon('type')}</span>
                  </div>
                </th>
                <th>Description</th>
                <th className="column-header status-col" onClick={() => handleSort('status')}>
                  <div className="header-content">
                    <span className="sortable">Status {getSortIcon('status')}</span>
                    <button 
                      className={`filter-btn ${hasActiveFilter('status') ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterColumn(activeFilterColumn === 'status' ? null : 'status');
                      }}
                      title="Filter by status"
                    >
                      🔍
                    </button>
                  </div>
                  {activeFilterColumn === 'status' && (
                    <div className="column-filter-dropdown">
                      {hasActiveFilter('status') && (
                        <button
                          className="clear-filter-btn top"
                          onClick={() => clearColumnFilter('status')}
                        >
                          ✕ Clear Filter
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Search status..."
                        value={filterSearchTerms.status}
                        onChange={(e) => handleFilterSearch('status', e.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options">
                        {getFilteredOptions('status').length > 0 ? (
                          getFilteredOptions('status').map(option => (
                            <button
                              key={option.id}
                              className={`filter-option ${columnFilters.status === option.id ? 'selected' : ''}`}
                              onClick={() => handleColumnFilter('status', option.id)}
                            >
                              {option.name}
                            </button>
                          ))
                        ) : (
                          <div className="no-options">
                            {filterSearchTerms.status ? 'No statuses found' : 'No statuses available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </th>
                <th className="date-col" onClick={() => handleSort('created_at')}>
                  <span className="sortable">Created At {getSortIcon('created_at')}</span>
                </th>
                <th className="action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedSystems.map(system => (
                <React.Fragment key={system.id}>
                  <tr className="system-row">
                    <td className="expand-cell">
                      {getSystemType(system) === 'Parent System' && (
                        <button
                          className="expand-toggle-btn"
                          onClick={() => toggleSystemExpansion(system.id)}
                          title={expandedSystems[system.id] ? 'Collapse subsystems' : 'Expand subsystems'}
                        >
                          {expandedSystems[system.id] ? '⊟' : '⊞'}
                        </button>
                      )}
                    </td>
                    <td className="system-name-cell">
                      <button
                        className="system-name-link"
                        onClick={() => handleSystemClick(system.id)}
                        title="Edit system"
                      >
                        {system.name}
                      </button>
                    </td>
                    <td className="type-cell">
                      <span className={`system-type-badge ${getSystemType(system).toLowerCase().replace(' ', '-')}`}>
                        {getSystemType(system)}
                      </span>
                    </td>
                    <td className="description-cell">{system.description}</td>
                    <td className="status-cell">
                      <span className={`status-badge status-${system.status}`}>{system.status}</span>
                    </td>
                    <td className="date-cell">{formatDate(system.created_at)}</td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleSystemEdit(system.id)}
                          className="action-btn edit-btn"
                          title="Edit System"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteSystem(system.id, e)}
                          className="action-btn delete-btn"
                          title="Delete System"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedSystems[system.id] && getSystemType(system) === 'Parent System' && (
                    <tr className="expanded-row">
                      <td colSpan="7" className="expanded-content">
                        <div className="associated-subsystems">
                          <h4>Subsystems</h4>
                          {systemSubsystems[system.id] ? (
                            systemSubsystems[system.id].length > 0 ? (
                              <table className="subsystems-sub-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {systemSubsystems[system.id].map(subsystem => (
                                    <tr key={subsystem.id}>
                                      <td>
                                        <button
                                          className="system-name-link"
                                          onClick={() => handleSystemClick(subsystem.id)}
                                          title="Edit subsystem"
                                        >
                                          {subsystem.name}
                                        </button>
                                      </td>
                                      <td>{subsystem.description}</td>
                                      <td className="status-cell"><span className={`status-badge status-${subsystem.status}`}>{subsystem.status}</span></td>
                                      <td>{formatDate(subsystem.created_at)}</td>
                                      <td className="action-cell">
                                        <div className="action-buttons">
                                          <button
                                            onClick={() => handleSystemEdit(subsystem.id)}
                                            className="action-btn edit-btn"
                                            title="Edit Subsystem"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={(e) => handleDeleteSystem(subsystem.id, e)}
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SystemManager;