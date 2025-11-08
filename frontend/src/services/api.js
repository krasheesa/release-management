// API Service for Release Management
const API_BASE_URL = 'http://localhost:8080/api';

// Get JWT token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Common headers for authenticated requests
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Release API functions
export const releaseService = {
  // Get all releases
  getAllReleases: async () => {
    const response = await fetch(`${API_BASE_URL}/releases`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single release
  getRelease: async (id) => {
    const response = await fetch(`${API_BASE_URL}/releases/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new release
  createRelease: async (releaseData) => {
    const response = await fetch(`${API_BASE_URL}/releases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(releaseData)
    });
    return handleResponse(response);
  },

  // Update release
  updateRelease: async (id, releaseData) => {
    const response = await fetch(`${API_BASE_URL}/releases/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(releaseData)
    });
    return handleResponse(response);
  },

  // Delete release
  deleteRelease: async (id) => {
    const response = await fetch(`${API_BASE_URL}/releases/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get builds for a release
  getReleaseBuilds: async (id) => {
    const response = await fetch(`${API_BASE_URL}/releases/${id}/builds`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Build API functions
export const buildService = {
  // Get all builds
  getAllBuilds: async () => {
    const response = await fetch(`${API_BASE_URL}/builds`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single build
  getBuild: async (id) => {
    const response = await fetch(`${API_BASE_URL}/builds/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new build
  createBuild: async (buildData) => {
    const response = await fetch(`${API_BASE_URL}/builds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(buildData)
    });
    return handleResponse(response);
  },

  // Update build
  updateBuild: async (id, buildData) => {
    const response = await fetch(`${API_BASE_URL}/builds/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(buildData)
    });
    return handleResponse(response);
  },

  // Delete build
  deleteBuild: async (id) => {
    const response = await fetch(`${API_BASE_URL}/builds/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// System API functions
export const systemService = {
  // Get all systems
  getAllSystems: async () => {
    const response = await fetch(`${API_BASE_URL}/systems`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single system
  getSystem: async (id) => {
    const response = await fetch(`${API_BASE_URL}/systems/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new system
  createSystem: async (systemData) => {
    const response = await fetch(`${API_BASE_URL}/systems`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(systemData)
    });
    return handleResponse(response);
  },

  // Update system
  updateSystem: async (id, systemData) => {
    const response = await fetch(`${API_BASE_URL}/systems/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(systemData)
    });
    return handleResponse(response);
  },

  // Delete system
  deleteSystem: async (id) => {
    const response = await fetch(`${API_BASE_URL}/systems/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get subsystems for a system
  getSubsystems: async (id) => {
    const response = await fetch(`${API_BASE_URL}/systems/${id}/subsystems`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Environment API functions
export const environmentService = {
  // Get all environments
  getAllEnvironments: async () => {
    const response = await fetch(`${API_BASE_URL}/environments`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single environment
  getEnvironment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new environment
  createEnvironment: async (environmentData) => {
    const response = await fetch(`${API_BASE_URL}/environments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(environmentData)
    });
    return handleResponse(response);
  },

  // Update environment
  updateEnvironment: async (id, environmentData) => {
    const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(environmentData)
    });
    return handleResponse(response);
  },

  // Delete environment
  deleteEnvironment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Environment Group API functions
export const environmentGroupsService = {
  getEnvironmentGroups: async () => {
    const response = await fetch(`${API_BASE_URL}/environment-groups`, {
      headers: getAuthHeaders(),
      method: 'GET'
    });
    return handleResponse(response);
  },

  getSpecificEnvironmentGroup: async (id) => {
    const response = await fetch(`${API_BASE_URL}/environment-groups/${id}`, {
      headers: getAuthHeaders(),
      method: 'GET'
    });
    return handleResponse(response);
  }

}