package domain

import "time"

// EnvironmentGroup represents a group of environments in the business domain
type EnvironmentGroup struct {
	ID           string
	Name         string
	Description  *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Environments []Environment
}
