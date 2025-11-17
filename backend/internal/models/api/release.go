package api

import "time"

// ReleaseRequest represents the request payload for creating a release
type ReleaseRequest struct {
	Name        string    `json:"name" binding:"required"`
	Description *string   `json:"description,omitempty"`
	ReleaseDate time.Time `json:"release_date" binding:"required"`
	Status      string    `json:"status,omitempty"`
	Type        string    `json:"type" binding:"required"`
}

// ReleaseResponse represents the release data returned in HTTP responses
type ReleaseResponse struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Description *string         `json:"description,omitempty"`
	ReleaseDate time.Time       `json:"release_date"`
	Status      string          `json:"status"`
	Type        string          `json:"type"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	Builds      []BuildResponse `json:"builds,omitempty"`
}

// ReleaseUpdateRequest represents the request payload for updating a release
type ReleaseUpdateRequest struct {
	Name        string    `json:"name,omitempty"`
	Description *string   `json:"description,omitempty"`
	ReleaseDate time.Time `json:"release_date,omitempty"`
	Status      string    `json:"status,omitempty"`
	Type        string    `json:"type,omitempty"`
}
