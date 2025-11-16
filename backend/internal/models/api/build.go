package api

import "time"

// BuildRequest represents the request payload for creating a build
type BuildRequest struct {
	SystemID  string    `json:"system_id" binding:"required"`
	ReleaseID *string   `json:"release_id,omitempty"`
	Version   string    `json:"version" binding:"required"`
	BuildDate time.Time `json:"build_date" binding:"required"`
}

// BuildResponse represents the build data returned in HTTP responses
type BuildResponse struct {
	ID          string    `json:"id"`
	SystemID    string    `json:"system_id"`
	SystemName  string    `json:"system_name"`
	ReleaseID   *string   `json:"release_id,omitempty"`
	ReleaseName string    `json:"release_name,omitempty"`
	Version     string    `json:"version"`
	BuildDate   time.Time `json:"build_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BuildUpdateRequest represents the request payload for updating a build
type BuildUpdateRequest struct {
	SystemID  string    `json:"system_id,omitempty"`
	ReleaseID *string   `json:"release_id,omitempty"`
	Version   string    `json:"version,omitempty"`
	BuildDate time.Time `json:"build_date,omitempty"`
}
