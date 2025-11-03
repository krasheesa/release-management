package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnvironmentType string
type EnvironmentStatus string

const (
	EnvTypeDev     EnvironmentType = "dev"
	EnvTypeStaging EnvironmentType = "staging"
	EnvTypeProd    EnvironmentType = "prod"
)

const (
	EnvStatusActive         EnvironmentStatus = "active"
	EnvStatusDecommissioned EnvironmentStatus = "decommissioned"
	EnvStatusMaintenance    EnvironmentStatus = "maintenance"
	EnvStatusPending        EnvironmentStatus = "pending"
)

type Environment struct {
	ID                 string            `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name               string            `json:"name" gorm:"not null"`
	Type               EnvironmentType   `json:"type" gorm:"type:varchar(20);not null"`
	Status             EnvironmentStatus `json:"status" gorm:"type:varchar(20);default:'active'"`
	URL                *string           `json:"url,omitempty"`
	Description        *string           `json:"description,omitempty"`
	ReleaseID          string            `json:"release_id" gorm:"type:varchar(36);not null"`
	EnvironmentGroupID *string           `json:"environment_group_id,omitempty" gorm:"type:varchar(36)"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`

	// Relationships
	EnvironmentSystems []EnvironmentSystem `json:"environment_systems,omitempty" gorm:"foreignKey:EnvironmentID"`
}

func (e *Environment) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	if e.Status == "" {
		e.Status = EnvStatusPending
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
