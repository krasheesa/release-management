package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnvironmentType string

const (
	EnvTypeDev     EnvironmentType = "dev"
	EnvTypeStaging EnvironmentType = "staging"
	EnvTypeProd    EnvironmentType = "prod"
)

type Environment struct {
	ID          string          `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string          `json:"name" gorm:"not null"`
	Type        EnvironmentType `json:"type" gorm:"type:varchar(20);not null"`
	URL         *string         `json:"url,omitempty"`
	Description *string         `json:"description,omitempty"`
	ReleaseID   string          `json:"release_id" gorm:"type:varchar(36);not null"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`

	// Relationships
	Release Release `json:"release,omitempty" gorm:"foreignKey:ReleaseID"`
}

func (e *Environment) BeforeCreate(tx *gorm.DB) error {
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

func (e *Environment) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
