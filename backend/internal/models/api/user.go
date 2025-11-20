package api

import "time"

// RoleRequest represents the role request payload
type UserRequest struct {
	UserName string `json:"name"`
}

// RoleAccess represents the role access request payload
type UserRoleRequest struct {
	UserID uint `json:"user_id"`
	RoleID uint `json:"role_id"`
}

// RoleAccessResponse represents the role access data returned in HTTP responses
type UserRoleResponse struct {
	UserID    uint      `json:"user_id"`
	RoleID    uint      `json:"role_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Roles []RolesResponse `json:"role"`
}
