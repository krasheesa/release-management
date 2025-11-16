package api

import "time"

// EnvironmentSystemRequest represents the request payload for creating/updating an environment-system relationship
type EnvironmentSystemRequest struct {
	SystemID string `json:"system_id" binding:"required"`
	Version  string `json:"version,omitempty"`
	Status   string `json:"status,omitempty"`
}

// EnvironmentSystemResponse represents the environment-system data returned in HTTP responses
type EnvironmentSystemResponse struct {
	ID            string               `json:"id"`
	EnvironmentID string               `json:"environment_id"`
	SystemID      string               `json:"system_id"`
	Version       string               `json:"version"`
	Status        string               `json:"status"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	System        *SystemResponse      `json:"system,omitempty"`
	Environment   *EnvironmentResponse `json:"environment,omitempty"`
}

// EnvironmentSystemUpdateRequest represents the request payload for updating an environment-system relationship
type EnvironmentSystemUpdateRequest struct {
	Version string `json:"version,omitempty"`
	Status  string `json:"status,omitempty"`
}

// SimpleSystemInfo represents a simplified system information for listings
type SimpleSystemInfo struct {
	SystemID   string `json:"system_id"`
	SystemName string `json:"system_name"`
	Status     string `json:"status"`
	Version    string `json:"version"`
}

// EnvironmentSystemsResponse represents the response for environment systems grouped by environment
type EnvironmentSystemsResponse struct {
	EnvironmentID   string             `json:"environment_id"`
	EnvironmentName string             `json:"environment_name"`
	Systems         []SimpleSystemInfo `json:"systems"`
}
