import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { buildService, systemService, releaseService } from '../services/api';
import { useNotification } from '../components/NotificationProvider';
import './BuildForm.css';

const BuildForm = ({ buildId, embedded = false, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { showSuccess, showError } = useNotification();
  const currentBuildId = buildId || id;
  const isEditing = currentBuildId && currentBuildId !== 'new';
  
  const [formData, setFormData] = useState({
    system_id: '',
    version: '',
    build_date: '',
    release_id: ''
  });
  const [systems, setSystems] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Filterable dropdown states
  const [systemSearchTerm, setSystemSearchTerm] = useState('');
  const [releaseSearchTerm, setReleaseSearchTerm] = useState('');
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);
  const [releaseDropdownOpen, setReleaseDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
    if (isEditing) {
      loadBuildData();
    }
  }, [currentBuildId, isEditing]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [systemsData, releasesData] = await Promise.all([
        systemService.getAllSystems(),
        releaseService.getAllReleases()
      ]);
      
      setSystems(systemsData);
      setReleases(releasesData);
    } catch (err) {
      setError('Failed to load form data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildData = async () => {
    try {
      const build = await buildService.getBuild(currentBuildId);
      
      // Format date for input field
      const buildDate = build.build_date ? 
        new Date(build.build_date).toISOString().split('T')[0] : '';
      
      setFormData({
        system_id: build.system_id || '',
        version: build.version || '',
        build_date: buildDate,
        release_id: build.release_id || ''
      });
    } catch (err) {
      setError('Failed to load build data: ' + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.system_id) {
      alert('Please select a system');
      return;
    }
    
    if (!formData.version) {
      alert('Please enter a version');
      return;
    }
    
    if (!formData.build_date) {
      alert('Please select a build date');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const buildData = {
        ...formData,
        build_date: `${formData.build_date}T00:00:00Z`,
        release_id: formData.release_id || null
      };

      if (isEditing) {
        await buildService.updateBuild(currentBuildId, buildData);
        showSuccess('Build updated successfully!');
      } else {
        await buildService.createBuild(buildData);
        showSuccess('Build created successfully!');
      }

      // Navigate back
      if (embedded && onBack) {
        onBack();
      } else {
        navigate('/build-manager');
      }
    } catch (err) {
      const errorMessage = 'Failed to save build: ' + err.message;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (embedded && onBack) {
      onBack();
    } else {
      navigate('/build-manager');
    }
  };

  const getSystemName = (systemId) => {
    const system = systems.find(s => s.id === systemId);
    return system ? system.name : 'Unknown System';
  };

  const getReleaseName = (releaseId) => {
    const release = releases.find(r => r.id === releaseId);
    return release ? release.name : 'Unknown Release';
  };

  // Filter functions
  const getFilteredSystems = () => {
    if (!systemSearchTerm) return systems;
    return systems.filter(system => 
      system.name.toLowerCase().includes(systemSearchTerm.toLowerCase())
    );
  };

  const getFilteredReleases = () => {
    if (!releaseSearchTerm) return releases;
    return releases.filter(release => 
      release.name.toLowerCase().includes(releaseSearchTerm.toLowerCase())
    );
  };

  // Handle system selection
  const handleSystemSelect = (systemId) => {
    setFormData(prev => ({ ...prev, system_id: systemId }));
    const selectedSystem = systems.find(s => s.id === systemId);
    setSystemSearchTerm(selectedSystem ? selectedSystem.name : '');
    setSystemDropdownOpen(false);
  };

  // Handle release selection
  const handleReleaseSelect = (releaseId) => {
    setFormData(prev => ({ ...prev, release_id: releaseId }));
    if (releaseId) {
      const selectedRelease = releases.find(r => r.id === releaseId);
      setReleaseSearchTerm(selectedRelease ? selectedRelease.name : '');
    } else {
      setReleaseSearchTerm(''); // Clear search term when no release is selected
    }
    setReleaseDropdownOpen(false);
  };

  // Initialize search terms when data loads
  React.useEffect(() => {
    if (formData.system_id && systems.length > 0) {
      const selectedSystem = systems.find(s => s.id === formData.system_id);
      if (selectedSystem) {
        setSystemSearchTerm(selectedSystem.name);
      }
    }
    if (formData.release_id && releases.length > 0) {
      const selectedRelease = releases.find(r => r.id === formData.release_id);
      if (selectedRelease) {
        setReleaseSearchTerm(selectedRelease.name);
      }
    }
  }, [formData.system_id, formData.release_id, systems, releases]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filterable-dropdown')) {
        setSystemDropdownOpen(false);
        setReleaseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading form data...</div>;
  }

  return (
    <div className="build-form">
      <div className="build-form-header">
        <h2>{isEditing ? 'Edit Build' : 'Create New Build'}</h2>
        <button onClick={handleCancel} className="back-btn">
          ← Back to Builds
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="build-form-content">
        <div className="form-section">
          <h3>Build Information</h3>
          
          <div className="form-group">
            <label htmlFor="system_id" className="form-label">
              System <span className="required">*</span>
            </label>
            <div className="filterable-dropdown">
              <input
                type="text"
                placeholder={isEditing ? "System (cannot be changed)" : "Type to search systems..."}
                value={systemSearchTerm}
                onChange={(e) => {
                  if (!isEditing) {
                    setSystemSearchTerm(e.target.value);
                    setSystemDropdownOpen(true);
                  }
                }}
                onFocus={() => !isEditing && setSystemDropdownOpen(true)}
                className={`form-control ${isEditing ? 'disabled' : ''}`}
                disabled={saving || isEditing}
                readOnly={isEditing}
              />
              {systemDropdownOpen && !isEditing && (
                <div className="dropdown-options">
                  {getFilteredSystems().length > 0 ? (
                    getFilteredSystems().map(system => (
                      <div
                        key={system.id}
                        className={`dropdown-option ${formData.system_id === system.id ? 'selected' : ''}`}
                        onClick={() => handleSystemSelect(system.id)}
                      >
                        {system.name}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-option no-results">
                      No systems found
                    </div>
                  )}
                </div>
              )}
            </div>
            {isEditing && (
              <small className="form-text text-muted">
                System cannot be changed when editing a build
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="version" className="form-label">
              Version <span className="required">*</span>
            </label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              placeholder="e.g., 1.0.0, v2.1.3-beta"
              className="form-control"
              required
              disabled={saving}
            />
            <small className="form-text">
              Enter the version number for this build
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="build_date" className="form-label">
              Build Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="build_date"
              name="build_date"
              value={formData.build_date}
              onChange={handleInputChange}
              className="form-control"
              required
              disabled={saving}
            />
            <small className="form-text">
              When was this build created?
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="release_id" className="form-label">
              Release <span className="optional">(Optional)</span>
            </label>
            <div className="filterable-dropdown">
              <input
                type="text"
                placeholder="Type to search releases or leave empty..."
                value={releaseSearchTerm}
                onChange={(e) => {
                  setReleaseSearchTerm(e.target.value);
                  setReleaseDropdownOpen(true);
                }}
                onFocus={() => setReleaseDropdownOpen(true)}
                className="form-control"
                disabled={saving}
              />
              {releaseDropdownOpen && (
                <div className="dropdown-options">
                  <div
                    className={`dropdown-option ${!formData.release_id ? 'selected' : ''}`}
                    onClick={() => handleReleaseSelect('')}
                  >
                    No release assigned
                  </div>
                  {getFilteredReleases().length > 0 ? (
                    getFilteredReleases().map(release => (
                      <div
                        key={release.id}
                        className={`dropdown-option ${formData.release_id === release.id ? 'selected' : ''}`}
                        onClick={() => handleReleaseSelect(release.id)}
                      >
                        {release.name}
                      </div>
                    ))
                  ) : releaseSearchTerm ? (
                    <div className="dropdown-option no-results">
                      No releases found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <small className="form-text">
              Optionally assign this build to a release
            </small>
          </div>
        </div>

        {formData.system_id && (
          <div className="form-preview">
            <h4>Build Preview</h4>
            <div className="preview-info">
              <div className="preview-item">
                <strong>System:</strong> {getSystemName(formData.system_id)}
              </div>
              <div className="preview-item">
                <strong>Version:</strong> 
                <span className="version-badge">{formData.version || 'Not specified'}</span>
              </div>
              <div className="preview-item">
                <strong>Build Date:</strong> 
                {formData.build_date ? 
                  new Date(formData.build_date).toLocaleDateString() : 
                  'Not specified'
                }
              </div>
              <div className="preview-item">
                <strong>Release:</strong> 
                {formData.release_id ? 
                  releases.find(r => r.id === formData.release_id)?.name || 'Unknown' :
                  'No release assigned'
                }
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Build' : 'Create Build')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuildForm;