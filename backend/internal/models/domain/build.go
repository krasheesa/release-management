package domain

import "time"

// Build represents a build in the business domain
type Build struct {
	ID        string
	SystemID  string
	ReleaseID *string
	Version   string
	BuildDate time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
	System    *System
	Release   *Release
}
