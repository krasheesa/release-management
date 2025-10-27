package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type System struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description,omitempty"`
	ParentID    *string   `json:"parent_id,omitempty" gorm:"type:varchar(36)"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Parent     *System  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Subsystems []System `json:"subsystems,omitempty" gorm:"foreignKey:ParentID"`
	Builds     []Build  `json:"builds,omitempty" gorm:"foreignKey:SystemID"`
}

func (s *System) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	s.UpdatedAt = time.Now()

	// Validate 2-level hierarchy constraint
	if s.ParentID != nil && *s.ParentID != "" {
		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}
		if parent.ParentID != nil && *parent.ParentID != "" {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}

func (s *System) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now()

	// Validate 2-level hierarchy constraint
	if s.ParentID != nil && *s.ParentID != "" {
		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}
		if parent.ParentID != nil && *parent.ParentID != "" {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}
