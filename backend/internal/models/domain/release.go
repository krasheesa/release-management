package domain

import "time"

// ReleaseStatus represents the status of a release
type ReleaseStatus string

const (
	StatusPlanned    ReleaseStatus = "planned"
	StatusInProgress ReleaseStatus = "in-progress"
	StatusCompleted  ReleaseStatus = "completed"
)

// ReleaseType represents the type of release
type ReleaseType string

const (
	TypeMajor  ReleaseType = "Major"
	TypeMinor  ReleaseType = "Minor"
	TypeHotfix ReleaseType = "Hotfix"
)

// Release represents a release in the business domain
type Release struct {
	ID          string
	Name        string
	Description *string
	ReleaseDate time.Time
	Status      ReleaseStatus
	Type        ReleaseType
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Builds      []Build
}
