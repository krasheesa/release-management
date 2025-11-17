package api

import "time"

// EnvironmentGroupRequest represents the request payload for creating an environment group
type EnvironmentGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description,omitempty"`
}

// SimplifiedEnvironmentInfo represents minimal environment data for listings
type SimplifiedEnvironmentInfo struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Status    string `json:"status"`
	ReleaseID string `json:"release_id"`
}

// EnvironmentGroup and Environment data for API responses
type EnvironmentGroupResponse struct {
	ID           string                      `json:"id"`
	Name         string                      `json:"name"`
	Description  *string                     `json:"description,omitempty"`
	CreatedAt    time.Time                   `json:"created_at"`
	UpdatedAt    time.Time                   `json:"updated_at"`
	Environments []SimplifiedEnvironmentInfo `json:"environments,omitempty"`
}

// EnvironmentGroupUpdateRequest represents the request payload for updating an environment group
type EnvironmentGroupUpdateRequest struct {
	Name        string  `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}
