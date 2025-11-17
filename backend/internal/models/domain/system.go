package domain

import "time"

// SystemType represents the type of system in the hierarchy
type SystemType string

const (
	SystemTypeParent    SystemType = "parent_systems"
	SystemTypeSystem    SystemType = "systems"
	SystemTypeSubsystem SystemType = "subsystems"
)

// IsValid checks if the system type is valid
func (st SystemType) IsValid() bool {
	switch st {
	case SystemTypeParent, SystemTypeSystem, SystemTypeSubsystem:
		return true
	}
	return false
}

// SystemStatus represents the operational status of a system
type SystemStatus string

const (
	StatusActive     SystemStatus = "active"
	StatusDeprecated SystemStatus = "deprecated"
)

// System represents a system entity in the business domain
type System struct {
	ID          string
	Name        string
	Description *string
	ParentID    *string
	Type        SystemType
	Status      SystemStatus
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Parent      *System
	Subsystems  []System
	Builds      []Build
}
