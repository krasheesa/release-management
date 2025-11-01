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
  // Load sorting from localStorage or default values
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('buildManager_sortBy') || 'build_date';
  });
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('buildManager_sortOrder') || 'desc';
  });
  const [columnFilters, setColumnFilters] = useState({
    system: '',
    release: ''
  });
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  const [filterSearchTerms, setFilterSearchTerms] = useState({
    system: '',
    release: ''
  });


  // Load data on component mount
  useEffect(() => {
    loadData();
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
        loadData(); // Reload builds after deletion
      } catch (err) {
        setError('Failed to delete build: ' + err.message);
      }
    }
  };

  // Handle system click to navigate to system detail page
  const handleSystemClick = (systemId, e) => {
    e.stopPropagation();
    if (systemId && embedded && onNavigateToDetail) {
      navigate(`/systems/${systemId}`);
    } else if (systemId) {
      navigate(`/systems/${systemId}`);
    }
  };

  // Handle release click to navigate to release detail page
  const handleReleaseClick = (releaseId, e) => {
    e.stopPropagation();
    if (releaseId && embedded && onNavigateToDetail) {
      navigate(`/releases/${releaseId}`);
    } else if (releaseId) {
      navigate(`/releases/${releaseId}`);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      localStorage.setItem('buildManager_sortOrder', newOrder);
    } else {
      setSortBy(field);
      setSortOrder('asc');
      localStorage.setItem('buildManager_sortBy', field);
      localStorage.setItem('buildManager_sortOrder', 'asc');
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



  // Filter and sort builds
  const filteredAndSortedBuilds = builds
    .filter(build => {
      const matchesSearch = 
        getSystemName(build.system_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getReleaseName(build.release_id).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Column-based filter logic
      const matchesSystemFilter = !columnFilters.system || build.system_id === columnFilters.system;
      const matchesReleaseFilter = !columnFilters.release || build.release_id === columnFilters.release;
      
      return matchesSearch && matchesSystemFilter && matchesReleaseFilter;
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

  const handleColumnFilter = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setActiveFilterColumn(null);
  };

  const handleFilterSearch = (column, value) => {
    setFilterSearchTerms(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getFilteredOptions = (column) => {
    const searchTerm = filterSearchTerms[column].toLowerCase();
    
    if (column === 'system') {
      // Only show systems that exist in current builds
      const existingSystemIds = [...new Set(builds.map(build => build.system_id))];
      return systems
        .filter(system => existingSystemIds.includes(system.id))
        .filter(system => system.name.toLowerCase().includes(searchTerm));
    } else if (column === 'release') {
      // Only show releases that exist in current builds
      const existingReleaseIds = [...new Set(builds.map(build => build.release_id).filter(Boolean))];
      return releases
        .filter(release => existingReleaseIds.includes(release.id))
        .filter(release => release.name.toLowerCase().includes(searchTerm));
    }
    return [];
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: ''
    }));
    setFilterSearchTerms(prev => ({
      ...prev,
      [column]: ''
    }));
  };

  const hasActiveFilter = (column) => {
    return columnFilters[column] !== '';
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
        <button onClick={handleCreateBuild} className="create-build-btn">
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
                <th className="column-header">
                  <div className="header-content">
                    <span 
                      onClick={() => handleSort('system')}
                      className="sortable"
                    >
                      System {getSortIcon('system')}
                    </span>
                    <button
                      className={`filter-btn ${hasActiveFilter('system') ? 'active' : ''}`}
                      onClick={() => setActiveFilterColumn(activeFilterColumn === 'system' ? null : 'system')}
                    >
                      🔍
                    </button>
                  </div>
                  {activeFilterColumn === 'system' && (
                    <div className="column-filter-dropdown">
                      {hasActiveFilter('system') && (
                        <button
                          className="clear-filter-btn top"
                          onClick={() => clearColumnFilter('system')}
                        >
                          ✕ Clear Filter
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Search systems..."
                        value={filterSearchTerms.system}
                        onChange={(e) => handleFilterSearch('system', e.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options">
                        {getFilteredOptions('system').length > 0 ? (
                          getFilteredOptions('system').map(system => (
                            <button
                              key={system.id}
                              className={`filter-option ${columnFilters.system === system.id ? 'selected' : ''}`}
                              onClick={() => handleColumnFilter('system', system.id)}
                            >
                              {system.name}
                            </button>
                          ))
                        ) : (
                          <div className="no-options">
                            {filterSearchTerms.system ? 'No systems found' : 'No systems available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </th>
                <th 
                  onClick={() => handleSort('version')}
                  className="sortable"
                >
                  Version {getSortIcon('version')}
                </th>
                <th className="column-header">
                  <div className="header-content">
                    <span 
                      onClick={() => handleSort('release')}
                      className="sortable"
                    >
                      Release {getSortIcon('release')}
                    </span>
                    <button
                      className={`filter-btn ${hasActiveFilter('release') ? 'active' : ''}`}
                      onClick={() => setActiveFilterColumn(activeFilterColumn === 'release' ? null : 'release')}
                    >
                      🔍
                    </button>
                  </div>
                  {activeFilterColumn === 'release' && (
                    <div className="column-filter-dropdown">
                      {hasActiveFilter('release') && (
                        <button
                          className="clear-filter-btn top"
                          onClick={() => clearColumnFilter('release')}
                        >
                          ✕ Clear Filter
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Search releases..."
                        value={filterSearchTerms.release}
                        onChange={(e) => handleFilterSearch('release', e.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options">
                        {getFilteredOptions('release').length > 0 ? (
                          getFilteredOptions('release').map(release => (
                            <button
                              key={release.id}
                              className={`filter-option ${columnFilters.release === release.id ? 'selected' : ''}`}
                              onClick={() => handleColumnFilter('release', release.id)}
                            >
                              {release.name}
                            </button>
                          ))
                        ) : (
                          <div className="no-options">
                            {filterSearchTerms.release ? 'No releases found' : 'No releases available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                    {build.system_id ? (
                      <button
                        className="system-name-link"
                        onClick={(e) => handleSystemClick(build.system_id, e)}
                        title={`View system details for ${getSystemName(build.system_id)}`}
                      >
                        {getSystemName(build.system_id)}
                      </button>
                    ) : (
                      getSystemName(build.system_id)
                    )}
                  </td>
                  <td className="version-cell">
                    <span className="version-badge">{build.version}</span>
                  </td>
                  <td className="release-cell">
                    {build.release_id ? (
                      <button
                        className="release-name-link"
                        onClick={(e) => handleReleaseClick(build.release_id, e)}
                        title={`View release details for ${getReleaseName(build.release_id)}`}
                      >
                        {getReleaseName(build.release_id)}
                      </button>
                    ) : (
                      <span className="no-release">No Release</span>
                    )}
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