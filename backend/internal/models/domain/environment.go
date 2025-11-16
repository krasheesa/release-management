package domain

import "time"

// EnvironmentType represents the type of environment
type EnvironmentType string

const (
	EnvTypeDev     EnvironmentType = "dev"
	EnvTypeStaging EnvironmentType = "staging"
	EnvTypeProd    EnvironmentType = "prod"
)

// EnvironmentStatus represents the operational status of an environment
type EnvironmentStatus string

const (
	EnvStatusActive         EnvironmentStatus = "active"
	EnvStatusDecommissioned EnvironmentStatus = "decommissioned"
	EnvStatusMaintenance    EnvironmentStatus = "maintenance"
	EnvStatusPending        EnvironmentStatus = "pending"
)

// Environment represents an environment in the business domain
type Environment struct {
	ID                 string
	Name               string
	Type               EnvironmentType
	Status             EnvironmentStatus
	URL                *string
	Description        *string
	ReleaseID          string
	EnvironmentGroupID *string
	CreatedAt          time.Time
	UpdatedAt          time.Time
	EnvironmentSystems []EnvironmentSystem
}
