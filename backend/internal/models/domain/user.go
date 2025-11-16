package domain

import "time"

// User represents a user in the system (core business entity)
type User struct {
	ID        uint
	Email     string
	Password  string
	IsAdmin   bool
	CreatedAt time.Time
	UpdatedAt time.Time
}
