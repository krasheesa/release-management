package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EnvironmentGroup represents the environment_groups table in the database
type EnvironmentGroup struct {
	ID          string `gorm:"primaryKey;type:varchar(36)"`
	Name        string `gorm:"not null"`
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time

	// Relationships for GORM
	Environments []Environment `gorm:"foreignKey:EnvironmentGroupID"`
}

// TableName specifies the table name for GORM
func (EnvironmentGroup) TableName() string {
	return "environment_groups"
}

// BeforeCreate hook for GORM
func (e *EnvironmentGroup) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	if e.CreatedAt.IsZero() {
		e.CreatedAt = time.Now()
	}
	if e.UpdatedAt.IsZero() {
		e.UpdatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate hook for GORM
func (e *EnvironmentGroup) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
