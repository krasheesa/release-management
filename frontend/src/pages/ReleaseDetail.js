import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { releaseService, buildService } from '../services/api';
import { useNotification } from '../components/NotificationProvider';
import './ReleaseDetail.css';

const ReleaseDetail = ({ releaseId, embedded = false, onBack }) => {
  const { id: routeId } = useParams() || {};
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // Use embedded releaseId if provided, otherwise use route params
  const id = embedded ? releaseId : routeId;
  const isNew = id === 'new';
  
  const [release, setRelease] = useState({
    name: '',
    description: '',
    release_date: '',
    status: 'draft',
    type: 'Minor'
  });
  const [releaseBuilds, setReleaseBuilds] = useState([]);
  const [availableBuilds, setAvailableBuilds] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showBuildSelector, setShowBuildSelector] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    if (isNew) {
      loadAvailableBuilds();
    } else {
      loadReleaseData();
      loadAvailableBuilds();
    }
  }, [id, isNew]);

  const loadReleaseData = async () => {
    try {
      setLoading(true);
      const [releaseData, buildsData] = await Promise.all([
        releaseService.getRelease(id),
        releaseService.getReleaseBuilds(id)
      ]);
      
      // Format date for input
      if (releaseData.release_date) {
        releaseData.release_date = releaseData.release_date.split('T')[0];
      }
      
      setRelease(releaseData);
      setReleaseBuilds(buildsData);
      setError(null);
    } catch (err) {
      setError('Failed to load release data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBuilds = async () => {
    try {
      const builds = await buildService.getAllBuilds();
      setAvailableBuilds(builds);
    } catch (err) {
      console.error('Failed to load available builds:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRelease(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!release.name) {
        alert('Name is a required field');
        return;
      }

      const releaseData = {
        ...release,
        release_date: release.release_date ? `${release.release_date}T00:00:00Z` : null
      };

      if (isNew) {
        const newRelease = await releaseService.createRelease(releaseData);
        showSuccess('Release created successfully!');
        if (embedded && onBack) {
          onBack(); // Go back to release manager to see the new release
        } else {
          navigate(`/releases/${newRelease.id}`);
        }
      } else {
        await releaseService.updateRelease(id, releaseData);
        showSuccess('Release updated successfully!');
        await loadReleaseData(); // Reload to get updated data
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to save release: ' + err.message;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBuild = async (buildId) => {
    try {
      // First get the complete build data
      const build = await buildService.getBuild(buildId);
      
      // Check if this system already has a build in this release
      const existingBuild = releaseBuilds.find(releaseBuild => 
        releaseBuild.system_id === build.system_id
      );
      
      if (existingBuild) {
        const systemName = build.system?.name || 'Unknown System';
        showError(`A build for system "${systemName}" already exists in this release. Each release can only have one build per system.`);
        return;
      }
      
      // Update the build with all required fields plus the new release_id
      await buildService.updateBuild(buildId, {
        system_id: build.system_id,
        version: build.version,
        build_date: build.build_date,
        release_id: id
      });
      
      // Reload builds data
      await loadReleaseData();
      await loadAvailableBuilds();
      setShowBuildSelector(false);
      showSuccess('Build successfully added to release!');
    } catch (err) {
      const errorMessage = err.message.includes('already exists') 
        ? err.message 
        : 'Failed to add build to release: ' + err.message;
      showError(errorMessage);
    }
  };

  const handleRemoveBuild = async (buildId) => {
    try {
      // First get the complete build data
      const build = await buildService.getBuild(buildId);
      
      // Remove association by updating build with all required fields plus null release_id
      await buildService.updateBuild(buildId, {
        system_id: build.system_id,
        version: build.version,
        build_date: build.build_date,
        release_id: null
      });
      
      // Reload builds data
      await loadReleaseData();
      await loadAvailableBuilds();
      showSuccess('Build successfully removed from release!');
    } catch (err) {
      showError('Failed to remove build from release: ' + err.message);
    }
  };

  const handleCancel = () => {
    if (embedded && onBack) {
      onBack();
    } else {
      navigate('/release-manager');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

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
  };

  // Get builds that are not associated with any release (or this release if editing)
  const unassociatedBuilds = availableBuilds.filter(build => 
    !build.release_id || (build.release_id === id)
  ).filter(build => 
    !releaseBuilds.some(releaseBuild => releaseBuild.id === build.id)
  );

  if (loading) {
    return (
      <div className="release-detail">
        <div className="loading-spinner">Loading release data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="release-detail">
        <div className="error-message">
          {error}
          <div className="error-actions">
            <button onClick={handleCancel} className="back-btn">
              Back to Releases
            </button>
            {!isNew && (
              <button onClick={loadReleaseData} className="retry-btn">Retry</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="release-detail">
      <div className="release-detail-header">
        <div className="header-left">
          <button onClick={handleCancel} className="back-btn">
            ← Back to Releases
          </button>
          <h1>{isNew ? 'Create New Release' : 'Release Details'}</h1>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="save-btn"
          >
            {saving ? 'Saving...' : (isNew ? 'Create Release' : 'Save Changes')}
          </button>
        </div>
      </div>

      <div className="release-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Release Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={release.name}
                onChange={handleInputChange}
                placeholder="Enter release name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="release_date">Release Date</label>
              <input
                type="date"
                id="release_date"
                name="release_date"
                value={release.release_date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={release.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="released">Released</option>
                <option value="deployed">Deployed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Release Type</label>
              <select
                id="type"
                name="type"
                value={release.type}
                onChange={handleInputChange}
              >
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Hotfix">Hotfix</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={release.description}
              onChange={handleInputChange}
              placeholder="Enter release description"
              rows="4"
            />
          </div>
        </div>

        {!isNew && (
          <div className="form-section">
            <div className="section-header">
              <h2>Associated Builds</h2>
              <button 
                onClick={() => setShowBuildSelector(true)}
                className="add-build-btn"
                disabled={unassociatedBuilds.length === 0}
              >
                + Add Build
              </button>
            </div>

            {releaseBuilds.length > 0 ? (
              <div className="builds-table-container">
                <table className="builds-table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Version</th>
                      <th>Build Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releaseBuilds.map(build => (
                      <tr key={build.id} className="build-row">
                        <td className="service-name-cell">
                          {build.system?.name || 'Unknown System'}
                        </td>
                        <td className="version-cell">
                          <span className="version-badge">{build.version}</span>
                        </td>
                        <td className="date-cell">
                          {formatDate(build.build_date)}
                        </td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleRemoveBuild(build.id)}
                            className="remove-build-btn"
                            title="Remove from release"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-builds">
                <p>No builds associated with this release yet.</p>
                {unassociatedBuilds.length > 0 && (
                  <button 
                    onClick={() => setShowBuildSelector(true)}
                    className="add-build-btn"
                  >
                    Add Your First Build
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Build Selector Modal */}
      {showBuildSelector && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Build to Release</h3>
              <button 
                onClick={() => setShowBuildSelector(false)}
                className="modal-close"
              >
                ✖️
              </button>
            </div>
            <div className="modal-body">
              {unassociatedBuilds.length > 0 ? (
                <div className="available-builds-table-container">
                  <table className="available-builds-table">
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Version</th>
                        <th>Build Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassociatedBuilds.map(build => (
                        <tr key={build.id} className="available-build-row">
                          <td className="service-name-cell">
                            {build.system?.name || 'Unknown System'}
                          </td>
                          <td className="version-cell">
                            <span className="version-badge">{build.version}</span>
                          </td>
                          <td className="date-cell">
                            {formatDate(build.build_date)}
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleAddBuild(build.id)}
                              className="add-btn"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-available-builds">
                  No unassociated builds available. All builds are already assigned to releases.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseDetail;