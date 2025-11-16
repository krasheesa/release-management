package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Environment represents the environment table in the database
type Environment struct {
	ID                 string `gorm:"primaryKey;type:varchar(36)"`
	Name               string `gorm:"not null"`
	Type               string `gorm:"type:varchar(20);not null"`
	Status             string `gorm:"type:varchar(20);default:'active'"`
	URL                *string
	Description        *string
	ReleaseID          string  `gorm:"type:varchar(36);not null"`
	EnvironmentGroupID *string `gorm:"type:varchar(36)"`
	CreatedAt          time.Time
	UpdatedAt          time.Time

	// Relationships for GORM
	EnvironmentSystems []EnvironmentSystem `gorm:"foreignKey:EnvironmentID"`
}

// TableName specifies the table name for GORM
func (Environment) TableName() string {
	return "environments"
}

// BeforeCreate hook for GORM
func (e *Environment) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	if e.Status == "" {
		e.Status = "pending"
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
func (e *Environment) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
