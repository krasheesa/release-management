package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnvironmentGroup struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Environments []Environment `json:"environments,omitempty" gorm:"foreignKey:EnvironmentGroupID"`
}

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

func (e *EnvironmentGroup) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
