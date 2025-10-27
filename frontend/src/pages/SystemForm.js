import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { systemService } from '../services/api';
import { useNotification } from '../components/NotificationProvider';
import './SystemForm.css';

const SystemForm = ({ systemId, parentSystemId, embedded = false, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const parentId = parentSystemId || location.state?.parentSystemId || searchParams.get('parent');
  const currentSystemId = systemId || id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: parentId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systems, setSystems] = useState([]);
  const isEditing = currentSystemId && currentSystemId !== 'new';

  useEffect(() => {
    loadSystems();
    if (isEditing) {
      loadSystem();
    } else if (parentId) {
      // When creating a subsystem, set the parent_id
      setFormData(prev => ({
        ...prev,
        parent_id: parentId
      }));
    }
  }, [currentSystemId, isEditing, parentId]);

  const loadSystems = async () => {
    try {
      const data = await systemService.getAllSystems();
      setSystems(data);
    } catch (err) {
      console.error('Failed to load systems:', err);
    }
  };

  const loadSystem = async () => {
    try {
      setLoading(true);
      const system = await systemService.getSystem(currentSystemId);
      setFormData({
        name: system.name || '',
        description: system.description || '',
        parent_id: system.parent_id || ''
      });
    } catch (err) {
      setError('Failed to load system: ' + err.message);
    } finally {
      setLoading(false);
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
    
    if (!formData.name.trim()) {
      setError('System name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const systemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id || null
      };

      if (isEditing) {
        await systemService.updateSystem(currentSystemId, systemData);
        showSuccess('System updated successfully!');
      } else {
        await systemService.createSystem(systemData);
        showSuccess('System created successfully!');
      }

      // Navigate back to the appropriate page
      if (embedded && onBack) {
        onBack();
      } else if (parentId) {
        navigate(`/systems/${parentId}`);
      } else {
        navigate('/systems');
      }
    } catch (err) {
      const errorMessage = 'Failed to save system: ' + err.message;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (embedded && onBack) {
      onBack();
    } else if (parentId) {
      navigate(`/systems/${parentId}`);
    } else {
      navigate('/systems');
    }
  };

  // Filter out the current system and its descendants from parent options
  const getAvailableParents = () => {
    if (!isEditing) return systems;
    
    const getDescendants = (systemId, allSystems) => {
      const descendants = [];
      const children = allSystems.filter(s => s.parent_id === systemId);
      
      for (const child of children) {
        descendants.push(child.id);
        descendants.push(...getDescendants(child.id, allSystems));
      }
      
      return descendants;
    };

    const excludeIds = [currentSystemId, ...getDescendants(currentSystemId, systems)];
    return systems.filter(s => !excludeIds.includes(s.id));
  };

  if (loading && isEditing) {
    return (
      <div className="system-form">
        <div className="loading-spinner">Loading system...</div>
      </div>
    );
  }

  return (
    <div className="system-form">
      <div className="form-header">
        <h1>{isEditing ? 'Edit System' : (parentId ? 'Create New Subsystem' : 'Create New System')}</h1>
        <button onClick={handleCancel} className="cancel-btn">
          ← Back
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label htmlFor="name">System Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter system name"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter system description (optional)"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parent_id">Parent System</label>
          {parentId ? (
            <input
              type="text"
              id="parent_id"
              value={systems.find(s => s.id === parentId)?.name || 'Loading...'}
              disabled
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
          ) : (
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">None (Root System)</option>
              {getAvailableParents()
                .filter(system => !system.parent_id) // Only show root systems
                .map(system => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update System' : 'Create System')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemForm;