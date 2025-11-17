package domain

import "time"

// EnvironmentSystem represents the relationship between an environment and a system
type EnvironmentSystem struct {
	ID            string
	EnvironmentID string
	SystemID      string
	Version       string
	Status        string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Environment   *Environment
	System        *System
}
