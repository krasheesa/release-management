import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildService, systemService, releaseService } from '../services/api';
import './BuildManager.css';

const BuildManager = ({ embedded = false, onNavigateToDetail }) => {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState([]);
  const [systems, setSystems] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('build_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterRelease, setFilterRelease] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    release: '',
    system: '',
    subsystem: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [buildsData, systemsData, releasesData] = await Promise.all([
        buildService.getAllBuilds(),
        systemService.getAllSystems(),
        releaseService.getAllReleases()
      ]);
      
      setBuilds(buildsData);
      setSystems(systemsData);
      setReleases(releasesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuild = () => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail('new');
    } else {
      navigate('/builds/new');
    }
  };

  const handleEditBuild = (buildId) => {
    if (embedded && onNavigateToDetail) {
      onNavigateToDetail(buildId + '/edit');
    } else {
      navigate(`/builds/${buildId}/edit`);
    }
  };

  const handleDeleteBuild = async (buildId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this build?')) {
      try {
        await buildService.deleteBuild(buildId);
        loadData(); // Reload data
      } catch (err) {
        alert('Failed to delete build: ' + err.message);
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSystemName = (systemId) => {
    const system = systems.find(s => s.id === systemId);
    return system ? system.name : 'Unknown System';
  };

  const getReleaseName = (releaseId) => {
    if (!releaseId) return 'No Release';
    const release = releases.find(r => r.id === releaseId);
    return release ? release.name : 'Unknown Release';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubsystems = () => {
    return systems.filter(system => system.parent_id);
  };

  const getParentSystems = () => {
    return systems.filter(system => !system.parent_id);
  };

  const handleFilterChange = (type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: value
    }));
    
    // Clear other filters when one is selected
    if (value) {
      const newFilters = { release: '', system: '', subsystem: '' };
      newFilters[type] = value;
      setActiveFilters(newFilters);
    }
    
    setShowFilterDropdown(false);
  };

  const clearAllFilters = () => {
    setActiveFilters({
      release: '',
      system: '',
      subsystem: ''
    });
  };

  const getActiveFilterLabel = () => {
    if (activeFilters.release) {
      const release = releases.find(r => r.id === activeFilters.release);
      return `Release: ${release?.name || 'Unknown'}`;
    }
    if (activeFilters.system) {
      const system = systems.find(s => s.id === activeFilters.system);
      return `System: ${system?.name || 'Unknown'}`;
    }
    if (activeFilters.subsystem) {
      const subsystem = systems.find(s => s.id === activeFilters.subsystem);
      return `Subsystem: ${subsystem?.name || 'Unknown'}`;
    }
    return 'Filter';
  };

  // Filter and sort builds
  const filteredAndSortedBuilds = builds
    .filter(build => {
      const matchesSearch = 
        getSystemName(build.system_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getReleaseName(build.release_id).toLowerCase().includes(searchTerm.toLowerCase());
      
      // New unified filter logic
      let matchesFilter = true;
      if (activeFilters.release) {
        matchesFilter = build.release_id === activeFilters.release;
      } else if (activeFilters.system) {
        matchesFilter = build.system_id === activeFilters.system;
      } else if (activeFilters.subsystem) {
        matchesFilter = build.system_id === activeFilters.subsystem;
      }
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'system':
          aValue = getSystemName(a.system_id);
          bValue = getSystemName(b.system_id);
          break;
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        case 'release':
          aValue = getReleaseName(a.release_id);
          bValue = getReleaseName(b.release_id);
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
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <div className="loading">Loading builds...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button onClick={loadData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="build-manager">
      <div className="build-manager-header">
        <h2>Build Manager</h2>
        <button onClick={handleCreateBuild} className="btn btn-primary">
          + Create Build
        </button>
      </div>

      <div className="build-manager-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search builds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <div className="filter-dropdown-container">
            <button
              className={`filter-button ${Object.values(activeFilters).some(v => v) ? 'active' : ''}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              {getActiveFilterLabel()} ▼
            </button>
            
            {showFilterDropdown && (
              <div className="filter-dropdown">
                <div className="filter-section">
                  <div className="filter-section-header">
                    <span>By Release</span>
                    {activeFilters.release && (
                      <button
                        className="clear-filter-btn"
                        onClick={() => handleFilterChange('release', '')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    {releases.map(release => (
                      <button
                        key={release.id}
                        className={`filter-option ${activeFilters.release === release.id ? 'selected' : ''}`}
                        onClick={() => handleFilterChange('release', release.id)}
                      >
                        {release.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="filter-section">
                  <div className="filter-section-header">
                    <span>By System</span>
                    {activeFilters.system && (
                      <button
                        className="clear-filter-btn"
                        onClick={() => handleFilterChange('system', '')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    {getParentSystems().map(system => (
                      <button
                        key={system.id}
                        className={`filter-option ${activeFilters.system === system.id ? 'selected' : ''}`}
                        onClick={() => handleFilterChange('system', system.id)}
                      >
                        {system.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="filter-section">
                  <div className="filter-section-header">
                    <span>By Subsystem</span>
                    {activeFilters.subsystem && (
                      <button
                        className="clear-filter-btn"
                        onClick={() => handleFilterChange('subsystem', '')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    {getSubsystems().map(subsystem => (
                      <button
                        key={subsystem.id}
                        className={`filter-option ${activeFilters.subsystem === subsystem.id ? 'selected' : ''}`}
                        onClick={() => handleFilterChange('subsystem', subsystem.id)}
                      >
                        {subsystem.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {Object.values(activeFilters).some(v => v) && (
                  <div className="filter-actions">
                    <button
                      className="clear-all-filters-btn"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="build-table-container">
        {filteredAndSortedBuilds.length === 0 ? (
          <div className="no-builds">
            <p>No builds found</p>
            <button onClick={handleCreateBuild} className="btn btn-primary">
              Create your first build
            </button>
          </div>
        ) : (
          <table className="build-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('system')}
                  className="sortable"
                >
                  System {getSortIcon('system')}
                </th>
                <th 
                  onClick={() => handleSort('version')}
                  className="sortable"
                >
                  Version {getSortIcon('version')}
                </th>
                <th 
                  onClick={() => handleSort('release')}
                  className="sortable"
                >
                  Release {getSortIcon('release')}
                </th>
                <th 
                  onClick={() => handleSort('build_date')}
                  className="sortable"
                >
                  Build Date {getSortIcon('build_date')}
                </th>
                <th 
                  onClick={() => handleSort('created_at')}
                  className="sortable"
                >
                  Created Date {getSortIcon('created_at')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBuilds.map(build => (
                <tr key={build.id} className="build-row">
                  <td className="system-cell">
                    {getSystemName(build.system_id)}
                  </td>
                  <td className="version-cell">
                    <span className="version-badge">{build.version}</span>
                  </td>
                  <td className="release-cell">
                    {getReleaseName(build.release_id)}
                  </td>
                  <td className="date-cell">
                    {formatDate(build.build_date)}
                  </td>
                  <td className="date-cell">
                    {formatDate(build.created_at)}
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEditBuild(build.id)}
                      className="btn btn-secondary btn-sm"
                      title="Edit build"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleDeleteBuild(build.id, e)}
                      className="btn btn-danger btn-sm"
                      title="Delete build"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="build-manager-footer">
        <p>Total: {filteredAndSortedBuilds.length} build{filteredAndSortedBuilds.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
};

export default BuildManager;