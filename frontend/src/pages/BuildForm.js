import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { buildService, systemService, releaseService } from '../services/api';
import './BuildForm.css';

const BuildForm = ({ buildId, embedded = false, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
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
      } else {
        await buildService.createBuild(buildData);
      }

      // Navigate back
      if (embedded && onBack) {
        onBack();
      } else {
        navigate('/build-manager');
      }
    } catch (err) {
      setError('Failed to save build: ' + err.message);
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

  if (loading) {
    return <div className="loading">Loading form data...</div>;
  }

  return (
    <div className="build-form">
      <div className="build-form-header">
        <h2>{isEditing ? 'Edit Build' : 'Create New Build'}</h2>
        <button onClick={handleCancel} className="btn btn-secondary">
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
            <select
              id="system_id"
              name="system_id"
              value={formData.system_id}
              onChange={handleInputChange}
              className="form-control"
              required
              disabled={saving}
            >
              <option value="">Select a system...</option>
              {systems.map(system => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
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
            <select
              id="release_id"
              name="release_id"
              value={formData.release_id}
              onChange={handleInputChange}
              className="form-control"
              disabled={saving}
            >
              <option value="">No release assigned</option>
              {releases.map(release => (
                <option key={release.id} value={release.id}>
                  {release.name}
                </option>
              ))}
            </select>
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