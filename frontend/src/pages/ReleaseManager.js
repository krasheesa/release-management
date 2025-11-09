import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { releaseService } from '../services/api';
import './ReleaseManager.css';

const ReleaseManager = ({ embedded = false, onNavigateToDetail }) => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Load sorting from localStorage or default values
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('releaseManager_sortBy') || 'name';
  });
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('releaseManager_sortOrder') || 'asc';
  });
  // Load filter from localStorage or default to 'all'
  const [releaseTypeFilter, setReleaseTypeFilter] = useState(() => {
    return localStorage.getItem('releaseManager_typeFilter') || 'all';
  });
  // Load column filters from localStorage
  const [columnFilters, setColumnFilters] = useState(() => {
    const saved = localStorage.getItem('releaseManager_columnFilters');
    return saved ? JSON.parse(saved) : { type: '', status: '' };
  });
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  // Load filter search terms from localStorage
  const [filterSearchTerms, setFilterSearchTerms] = useState(() => {
    const saved = localStorage.getItem('releaseManager_filterSearchTerms');
    return saved ? JSON.parse(saved) : { type: '', status: '' };
  });
  const [expandedReleases, setExpandedReleases] = useState({});
  const [releaseBuilds, setReleaseBuilds] = useState({});

  // Load releases on component mount
  useEffect(() => {
    loadReleases();
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

  const loadReleases = async () => {
    try {
      setLoading(true);
      const data = await releaseService.getAllReleases();
      setReleases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load releases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReleaseBuilds = async (releaseId) => {
    try {
      const builds = await releaseService.getReleaseBuilds(releaseId);
      setReleaseBuilds(prev => ({
        ...prev,
        [releaseId]: builds
      }));
    } catch (err) {
      console.error('Failed to load builds for release:', err);
    }
  };

  const toggleReleaseExpansion = (releaseId) => {
    const isExpanded = expandedReleases[releaseId];
    
    setExpandedReleases(prev => ({
      ...prev,
      [releaseId]: !isExpanded
    }));

    // Load builds if expanding and not already loaded
    if (!isExpanded && !releaseBuilds[releaseId]) {
      loadReleaseBuilds(releaseId);
    }
  };

  const handleReleaseClick = (releaseId) => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail(releaseId);
    } else {
      navigate(`/releases/${releaseId}`);
    }
  };

  const handleCreateRelease = () => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail('new');
    } else {
      navigate('/releases/new');
    }
  };

  // Handle filter change and save to localStorage
  const handleReleaseTypeFilterChange = (newFilter) => {
    setReleaseTypeFilter(newFilter);
    localStorage.setItem('releaseManager_typeFilter', newFilter);
  };

  // Handle build click to navigate to build edit page
  const handleBuildClick = (buildId, e) => {
    e.stopPropagation(); // Prevent triggering release expansion/collapse
    if (embedded && onNavigateToDetail) {
      // If embedded, we need to navigate to build manager or handle differently
      navigate(`/builds/${buildId}/edit`);
    } else {
      navigate(`/builds/${buildId}/edit`);
    }
  };

  const handleDeleteRelease = async (releaseId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this release?')) {
      try {
        await releaseService.deleteRelease(releaseId);
        loadReleases(); // Reload the list
      } catch (err) {
        alert('Failed to delete release: ' + err.message);
      }
    }
  };

  // Handle sorting with proper localStorage persistence
  const handleSort = (field) => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      localStorage.setItem('releaseManager_sortOrder', newOrder);
    } else {
      setSortBy(field);
      setSortOrder('asc');
      localStorage.setItem('releaseManager_sortBy', field);
      localStorage.setItem('releaseManager_sortOrder', 'asc');
    }
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
    localStorage.setItem('releaseManager_columnFilters', JSON.stringify(newFilters));
    setActiveFilterColumn(null);
  };

  const handleFilterSearch = (column, value) => {
    const newSearchTerms = {
      ...filterSearchTerms,
      [column]: value
    };
    setFilterSearchTerms(newSearchTerms);
    localStorage.setItem('releaseManager_filterSearchTerms', JSON.stringify(newSearchTerms));
  };

  const getFilteredOptions = (column) => {
    const searchTerm = filterSearchTerms[column].toLowerCase();
    
    if (column === 'type') {
      const existingTypes = [...new Set(releases.map(release => release.type).filter(Boolean))];
      return existingTypes
        .filter(type => type.toLowerCase().includes(searchTerm))
        .map(type => ({ id: type, name: type }));
    } else if (column === 'status') {
      const existingStatuses = [...new Set(releases.map(release => release.status).filter(Boolean))];
      return existingStatuses
        .filter(status => status.toLowerCase().includes(searchTerm))
        .map(status => ({ id: status, name: status.replace('_', ' ').toUpperCase() }));
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
    localStorage.setItem('releaseManager_columnFilters', JSON.stringify(newFilters));
    localStorage.setItem('releaseManager_filterSearchTerms', JSON.stringify(newSearchTerms));
  };

  const hasActiveFilter = (column) => {
    return columnFilters[column] !== '';
  };

  // Filter and sort releases
  const filteredAndSortedReleases = releases
    .filter(release => {
      // Search filter
      const matchesSearch = 
        release.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        release.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Release type filter (original dropdown)
      const matchesTypeFilter = releaseTypeFilter === 'all' || release.type === releaseTypeFilter;
      
      // Column-based filters
      const matchesColumnTypeFilter = !columnFilters.type || release.type === columnFilters.type;
      const matchesColumnStatusFilter = !columnFilters.status || release.status === columnFilters.status;
      
      return matchesSearch && matchesTypeFilter && matchesColumnTypeFilter && matchesColumnStatusFilter;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Handle date sorting
      if (sortBy === 'release_date' || sortBy === 'created_at') {
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

  const getReleaseCounts = () => {
    const counts = {
      all: releases.length,
      Major: releases.filter(r => r.type === 'Major').length,
      Minor: releases.filter(r => r.type === 'Minor').length,
      Patch: releases.filter(r => r.type === 'Patch').length
    };
    return counts;
  };

  const releaseCounts = getReleaseCounts();

  const getStatusBadge = (status) => {
    const statusClasses = {
      'draft': 'status-draft',
      'planned': 'status-planned', 
      'in_progress': 'status-in-progress',
      'released': 'status-released',
      'deployed': 'status-deployed',
      'cancelled': 'status-cancelled'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };  if (loading) {
    return (
      <div className="release-manager">
        <div className="loading-spinner">Loading releases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="release-manager">
        <div className="error-message">
          {error}
          <button onClick={loadReleases} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="release-manager">
      <div className="release-manager-header">
        <div className="header-left">
          <h1>Release Manager</h1>
        </div>
        <button onClick={handleCreateRelease} className="create-release-btn">
          + Create New Release
        </button>
      </div>

      <div className="release-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search releases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

      </div>

      <div className="releases-table-container">
        {filteredAndSortedReleases.length === 0 ? (
          <div className="empty-state">
            <h3>No releases found</h3>
            <p>Create your first release to get started!</p>
            <button onClick={handleCreateRelease} className="create-release-btn">
              Create Release
            </button>
          </div>
        ) : (
          <table className="releases-table">
            <thead>
              <tr>
                <th className="expand-col"></th>
                <th 
                  onClick={() => handleSort('name')}
                  className="release-name-col sortable"
                >
                  Release Name {getSortIcon('name')}
                </th>
                <th className="type-col column-header">
                  <div className="header-content">
                    <span 
                      onClick={() => handleSort('type')}
                      className="sortable"
                    >
                      Type {getSortIcon('type')}
                    </span>
                    <button
                      className={`filter-btn ${hasActiveFilter('type') ? 'active' : ''}`}
                      onClick={() => setActiveFilterColumn(activeFilterColumn === 'type' ? null : 'type')}
                    >
                      🔍
                    </button>
                  </div>
                  {activeFilterColumn === 'type' && (
                    <div className="column-filter-dropdown">
                      {hasActiveFilter('type') && (
                        <button
                          className="clear-filter-btn top"
                          onClick={() => clearColumnFilter('type')}
                        >
                          ✕ Clear Filter
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Search types..."
                        value={filterSearchTerms.type}
                        onChange={(e) => handleFilterSearch('type', e.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options">
                        {getFilteredOptions('type').length > 0 ? (
                          getFilteredOptions('type').map(type => (
                            <button
                              key={type.id}
                              className={`filter-option ${columnFilters.type === type.id ? 'selected' : ''}`}
                              onClick={() => handleColumnFilter('type', type.id)}
                            >
                              {type.name}
                            </button>
                          ))
                        ) : (
                          <div className="no-options">
                            {filterSearchTerms.type ? 'No types found' : 'No types available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </th>
                <th className="status-col column-header">
                  <div className="header-content">
                    <span 
                      onClick={() => handleSort('status')}
                      className="sortable"
                    >
                      Status {getSortIcon('status')}
                    </span>
                    <button
                      className={`filter-btn ${hasActiveFilter('status') ? 'active' : ''}`}
                      onClick={() => setActiveFilterColumn(activeFilterColumn === 'status' ? null : 'status')}
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
                        placeholder="Search statuses..."
                        value={filterSearchTerms.status}
                        onChange={(e) => handleFilterSearch('status', e.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options">
                        {getFilteredOptions('status').length > 0 ? (
                          getFilteredOptions('status').map(status => (
                            <button
                              key={status.id}
                              className={`filter-option ${columnFilters.status === status.id ? 'selected' : ''}`}
                              onClick={() => handleColumnFilter('status', status.id)}
                            >
                              {status.name}
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
                <th 
                  onClick={() => handleSort('release_date')}
                  className="date-col sortable"
                >
                  Release Date {getSortIcon('release_date')}
                </th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReleases.map(release => (
                <Fragment key={release.id}>
                  <tr className="release-row">
                    <td className="expand-cell">
                      <button 
                        className="expand-toggle-btn"
                        onClick={() => toggleReleaseExpansion(release.id)}
                        title={expandedReleases[release.id] ? "Collapse" : "Expand"}
                      >
                        {expandedReleases[release.id] ? '⊟' : '⊞'}
                      </button>
                    </td>
                    <td className="release-name-cell">
                      <button
                        className="release-name-link"
                        onClick={() => handleReleaseClick(release.id)}
                        title="Edit Release"
                      >
                        {release.name}
                      </button>
                    </td>
                    <td className="type-cell">
                      <span className={`release-type-badge ${release.type?.toLowerCase()}`}>
                        {release.type}
                      </span>
                    </td>
                    <td className="status-cell">
                      {getStatusBadge(release.status)}
                    </td>
                    <td className="date-cell">
                      {formatDate(release.release_date)}
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleReleaseClick(release.id)}
                          className="action-btn edit-btn"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteRelease(release.id, e)}
                          className="action-btn delete-btn"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedReleases[release.id] && (
                    <tr className="expanded-row">
                      <td colSpan="6" className="expanded-content">
                        <div className="associated-builds">
                          <h4>Associated Builds</h4>
                          {releaseBuilds[release.id] ? (
                            releaseBuilds[release.id].length > 0 ? (
                              <table className="builds-sub-table">
                                <thead>
                                  <tr>
                                    <th>Service Name</th>
                                    <th>Version</th>
                                    <th>Build Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {releaseBuilds[release.id].map(build => (
                                    <tr key={build.id}>
                                      <td>{build.system?.name || 'Unknown System'}</td>
                                      <td><span className="version-badge">{build.version}</span></td>
                                      <td>{formatDate(build.build_date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="no-builds">No builds associated with this release</p>
                            )
                          ) : (
                            <p className="loading-builds">Loading builds...</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReleaseManager;