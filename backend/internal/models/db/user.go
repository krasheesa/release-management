package db

import (
	"time"

	"gorm.io/gorm"
)

// User represents the user table in the database
type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"uniqueIndex;not null"`
	Password  string `gorm:"not null"`
	IsAdmin   bool   `gorm:"default:false"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TableName specifies the table name for GORM
func (User) TableName() string {
	return "users"
}

// BeforeCreate hook for GORM
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	if u.UpdatedAt.IsZero() {
		u.UpdatedAt = time.Now()
	}
	return nil
}
