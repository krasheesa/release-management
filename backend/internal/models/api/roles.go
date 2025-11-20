package api

import "time"

// RoleRequest represents the role request payload
type RolesRequest struct {
	RoleName string `json:"name"`
}

// RoleAccess represents the role access request payload
type RoleAccessRequest struct {
	RoleID   uint `json:"role_id"`
	AccessID uint `json:"access_id"`
}

// RoleResponse represents the role data returned in HTTP responses
type RolesResponse struct {
	ID        uint      `json:"id"`
	RoleName  string    `json:"role_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Accesses []AccessResponse `json:"accesses,omitempty"`
}

// RoleAccessResponse represents the role access data returned in HTTP responses
type RoleAccessResponse struct {
	ID         uint      `json:"id"`
	RoleID     uint      `json:"role_id"`
	RoleName   string    `json:"role_name"`
	AccessName string    `json:"access_name"`
	AccessID   uint      `json:"access_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// AccessResponse represents the access data returned in HTTP responses
type AccessResponse struct {
	AccessID   uint      `json:"access_id"`
	AccessName string    `json:"access_name"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
