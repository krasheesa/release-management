package api

import "time"

// EnvironmentGroupRequest represents the request payload for creating an environment group
type EnvironmentGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description,omitempty"`
}

// EnvironmentGroupResponse represents the environment group data returned in HTTP responses
type EnvironmentGroupResponse struct {
	ID           string                `json:"id"`
	Name         string                `json:"name"`
	Description  *string               `json:"description,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
	Environments []EnvironmentResponse `json:"environments,omitempty"`
}

// EnvironmentGroupUpdateRequest represents the request payload for updating an environment group
type EnvironmentGroupUpdateRequest struct {
	Name        string  `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}
