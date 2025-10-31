package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SystemType string

const (
	SystemTypeParent    SystemType = "parent_systems"
	SystemTypeSystem    SystemType = "systems"
	SystemTypeSubsystem SystemType = "subsystems"
)

func (st SystemType) IsValid() bool {
	switch st {
	case SystemTypeParent, SystemTypeSystem, SystemTypeSubsystem:
		return true
	}
	return false
}

type System struct {
	ID          string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string     `json:"name" gorm:"not null"`
	Description *string    `json:"description,omitempty"`
	ParentID    *string    `json:"parent_id,omitempty" gorm:"type:varchar(36)"`
	Type        SystemType `json:"type" gorm:"type:varchar(20)"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

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

	// Validate type
	if !s.Type.IsValid() {
		return gorm.ErrInvalidValue
	}

	// Validate type consistency with parent_id
	if s.ParentID != nil && *s.ParentID != "" {
		// If has parent, must be subsystem
		if s.Type != SystemTypeSubsystem {
			return gorm.ErrInvalidValue
		}

		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}

		// Parent must be parent_systems type
		if parent.Type != SystemTypeParent {
			return gorm.ErrInvalidValue
		}
	} else {
		// If no parent, cannot be subsystem
		if s.Type == SystemTypeSubsystem {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}

func (s *System) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now()

	// Get current system state
	var current System
	if err := tx.First(&current, "id = ?", s.ID).Error; err != nil {
		return err
	}

	// Validate type
	if !s.Type.IsValid() {
		return gorm.ErrInvalidValue
	}

	// Check if type can be changed
	if current.Type != s.Type {
		// Cannot change type if parent_systems has subsystems
		if current.Type == SystemTypeParent {
			var subsystemCount int64
			tx.Model(&System{}).Where("parent_id = ?", s.ID).Count(&subsystemCount)
			if subsystemCount > 0 {
				return gorm.ErrInvalidValue
			}
		}

		// Cannot change type if systems has builds
		if current.Type == SystemTypeSystem {
			var buildCount int64
			tx.Model(&Build{}).Where("system_id = ?", s.ID).Count(&buildCount)
			if buildCount > 0 {
				return gorm.ErrInvalidValue
			}
		}
	}

	// Validate type consistency with parent_id
	if s.ParentID != nil && *s.ParentID != "" {
		// If has parent, must be subsystem
		if s.Type != SystemTypeSubsystem {
			return gorm.ErrInvalidValue
		}

		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}

		// Parent must be parent_systems type
		if parent.Type != SystemTypeParent {
			return gorm.ErrInvalidValue
		}
	} else {
		// If no parent, cannot be subsystem
		if s.Type == SystemTypeSubsystem {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}
