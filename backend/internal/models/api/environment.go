package api

import "time"

// EnvironmentRequest represents the request payload for creating an environment
type EnvironmentRequest struct {
	Name               string  `json:"name" binding:"required"`
	Type               string  `json:"type" binding:"required"`
	Status             string  `json:"status,omitempty"`
	URL                *string `json:"url,omitempty"`
	Description        *string `json:"description,omitempty"`
	ReleaseID          string  `json:"release_id" binding:"required"`
	EnvironmentGroupID *string `json:"environment_group_id,omitempty"`
}

// EnvironmentResponse represents the environment data returned in HTTP responses
type EnvironmentResponse struct {
	ID                 string                      `json:"id"`
	Name               string                      `json:"name"`
	Type               string                      `json:"type"`
	Status             string                      `json:"status"`
	URL                *string                     `json:"url,omitempty"`
	Description        *string                     `json:"description,omitempty"`
	ReleaseID          string                      `json:"release_id"`
	EnvironmentGroupID *string                     `json:"environment_group_id,omitempty"`
	CreatedAt          time.Time                   `json:"created_at"`
	UpdatedAt          time.Time                   `json:"updated_at"`
	EnvironmentSystems []EnvironmentSystemResponse `json:"environment_systems,omitempty"`
}

// EnvironmentUpdateRequest represents the request payload for updating an environment
type EnvironmentUpdateRequest struct {
	Name               string  `json:"name,omitempty"`
	Type               string  `json:"type,omitempty"`
	Status             string  `json:"status,omitempty"`
	URL                *string `json:"url,omitempty"`
	Description        *string `json:"description,omitempty"`
	ReleaseID          string  `json:"release_id,omitempty"`
	EnvironmentGroupID *string `json:"environment_group_id,omitempty"`
}
