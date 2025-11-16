package api

import "time"

// SystemRequest represents the request payload for creating/updating a system
type SystemRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description,omitempty"`
	ParentID    *string `json:"parent_id,omitempty"`
	Type        string  `json:"type" binding:"required"`
	Status      string  `json:"status,omitempty"`
}

// SystemResponse represents the system data returned in HTTP responses
type SystemResponse struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Description *string          `json:"description,omitempty"`
	ParentID    *string          `json:"parent_id,omitempty"`
	Type        string           `json:"type"`
	Status      string           `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Parent      *SystemResponse  `json:"parent,omitempty"`
	Subsystems  []SystemResponse `json:"subsystems,omitempty"`
	Builds      []BuildResponse  `json:"builds,omitempty"`
}

// SystemUpdateRequest represents the request payload for updating a system
type SystemUpdateRequest struct {
	Name        string  `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	ParentID    *string `json:"parent_id,omitempty"`
	Type        string  `json:"type,omitempty"`
	Status      string  `json:"status,omitempty"`
}
