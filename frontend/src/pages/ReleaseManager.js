import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { releaseService } from '../services/api';
import './ReleaseManager.css';

const ReleaseManager = ({ embedded = false, onNavigateToDetail }) => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [releaseTypeFilter, setReleaseTypeFilter] = useState('all'); // New filter state
  const [expandedReleases, setExpandedReleases] = useState({});
  const [releaseBuilds, setReleaseBuilds] = useState({});

  // Load releases on component mount
  useEffect(() => {
    loadReleases();
  }, []);

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

  // Filter and sort releases
  const filteredAndSortedReleases = releases
    .filter(release => {
      // Release type filter
      if (releaseTypeFilter === 'all') {
        return true; // Show all types
      } else {
        return release.type === releaseTypeFilter; // Show specific type
      }
    })
    .filter(release => 
      release.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
          <div className="results-info">
            {releaseTypeFilter === 'all' ? 
              `Showing ${filteredAndSortedReleases.length} of ${releases.length} releases` :
              `Showing ${filteredAndSortedReleases.length} ${releaseTypeFilter} ${filteredAndSortedReleases.length === 1 ? 'release' : 'releases'}`
            }
          </div>
        </div>
        <button onClick={handleCreateRelease} className="create-release-btn">
          ➕ Create New Release
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

        <div className="filter-controls">
          <label htmlFor="release-type-filter" className="filter-label">Filter by Type:</label>
          <select
            id="release-type-filter"
            value={releaseTypeFilter}
            onChange={(e) => setReleaseTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Releases ({releaseCounts.all})</option>
            <option value="Major">Major ({releaseCounts.Major})</option>
            <option value="Minor">Minor ({releaseCounts.Minor})</option>
            <option value="Patch">Patch ({releaseCounts.Patch})</option>
          </select>
          {releaseTypeFilter !== 'all' && (
            <button
              onClick={() => setReleaseTypeFilter('all')}
              className="clear-filter-btn"
              title="Clear filter"
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
            <option value="release_date">Sort by Release Date</option>
            <option value="created_at">Sort by Created Date</option>
            <option value="status">Sort by Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '⬆️' : '⬇️'}
          </button>
        </div>
      </div>

      <div className="releases-list">
        {filteredAndSortedReleases.length === 0 ? (
          <div className="empty-state">
            <h3>No releases found</h3>
            <p>Create your first release to get started!</p>
            <button onClick={handleCreateRelease} className="create-release-btn">
              Create Release
            </button>
          </div>
        ) : (
          filteredAndSortedReleases.map(release => (
            <div key={release.id} className="release-card">
              <div 
                className="release-header"
                onClick={() => toggleReleaseExpansion(release.id)}
              >
                <div className="release-info">
                  <div className="release-title">
                    <h3>{release.name} <span className={`release-type release-type-${release.type?.toLowerCase()}`}>{release.type}</span></h3>
                  </div>
                  <p className="release-description">{release.description}</p>
                  <div className="release-meta">
                    <span className="release-date">
                      📅 {formatDate(release.release_date)}
                    </span>
                    {getStatusBadge(release.status)}
                  </div>
                </div>
                <div className="release-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReleaseClick(release.id);
                    }}
                    className="edit-btn"
                    title="View Release"
                  >
                    👁️
                  </button>
                  <button
                    onClick={(e) => handleDeleteRelease(release.id, e)}
                    className="delete-btn"
                    title="Delete Release"
                  >
                    🗑️
                  </button>
                  <button className="expand-btn">
                    {expandedReleases[release.id] ? '▼' : '▶️'}
                  </button>
                </div>
              </div>

              {expandedReleases[release.id] && (
                <div className="release-builds">
                  <h4>Associated Builds</h4>
                  {releaseBuilds[release.id] ? (
                    releaseBuilds[release.id].length > 0 ? (
                      <div className="builds-table-container">
                        <table className="builds-table">
                          <thead>
                            <tr>
                              <th>Service Name</th>
                              <th>Version</th>
                              <th>Build Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {releaseBuilds[release.id].map(build => (
                              <tr key={build.id} className="build-row">
                                <td className="service-name-cell">
                                  {build.system?.name || 'Unknown System'}
                                </td>
                                <td className="version-cell">
                                  <span className="version-badge">v{build.version}</span>
                                </td>
                                <td className="date-cell">
                                  {formatDate(build.build_date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-builds">No builds associated with this release</p>
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
  );
};

export default ReleaseManager;