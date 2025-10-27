package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReleaseStatus string
type ReleaseType string

const (
	StatusPlanned    ReleaseStatus = "planned"
	StatusInProgress ReleaseStatus = "in-progress"
	StatusCompleted  ReleaseStatus = "completed"

	TypeMajor  ReleaseType = "Major"
	TypeMinor  ReleaseType = "Minor"
	TypeHotfix ReleaseType = "Hotfix"
)

type Release struct {
	ID          string        `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string        `json:"name" gorm:"not null"`
	Description *string       `json:"description,omitempty"`
	ReleaseDate time.Time     `json:"release_date"`
	Status      ReleaseStatus `json:"status" gorm:"type:varchar(20);default:'planned'"`
	Type        ReleaseType   `json:"type" gorm:"type:varchar(10);not null"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`

	// Relationships
	Builds       []Build       `json:"builds,omitempty" gorm:"foreignKey:ReleaseID"`
	Environments []Environment `json:"environments,omitempty" gorm:"foreignKey:ReleaseID"`
}

func (r *Release) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now()
	}
	if r.UpdatedAt.IsZero() {
		r.UpdatedAt = time.Now()
	}
	return nil
}

func (r *Release) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = time.Now()
	return nil
}
