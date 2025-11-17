package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// System represents the system table in the database
type System struct {
	ID          string `gorm:"primaryKey;type:varchar(36)"`
	Name        string `gorm:"not null"`
	Description *string
	ParentID    *string `gorm:"type:varchar(36)"`
	Type        string  `gorm:"type:varchar(20)"`
	Status      string  `gorm:"type:varchar(20);default:'active'"`
	CreatedAt   time.Time
	UpdatedAt   time.Time

	// Relationships for GORM
	Parent     *System  `gorm:"foreignKey:ParentID"`
	Subsystems []System `gorm:"foreignKey:ParentID"`
	Builds     []Build  `gorm:"foreignKey:SystemID"`
}

// TableName specifies the table name for GORM
func (System) TableName() string {
	return "systems"
}

// BeforeCreate hook for GORM
func (s *System) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	s.UpdatedAt = time.Now()

	// Validate type
	if !isValidSystemType(s.Type) {
		return gorm.ErrInvalidValue
	}

	// Validate type consistency with parent_id
	if s.ParentID != nil && *s.ParentID != "" {
		// If has parent, must be subsystem
		if s.Type != "subsystems" {
			return gorm.ErrInvalidValue
		}

		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}

		// Parent must be parent_systems type
		if parent.Type != "parent_systems" {
			return gorm.ErrInvalidValue
		}
	} else {
		// If no parent, cannot be subsystem
		if s.Type == "subsystems" {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}

// BeforeUpdate hook for GORM
func (s *System) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now()

	// Get current system state
	var current System
	if err := tx.First(&current, "id = ?", s.ID).Error; err != nil {
		return err
	}

	// Validate type
	if !isValidSystemType(s.Type) {
		return gorm.ErrInvalidValue
	}

	// Check if type can be changed
	if current.Type != s.Type {
		// Cannot change type if parent_systems has subsystems
		if current.Type == "parent_systems" {
			var subsystemCount int64
			tx.Model(&System{}).Where("parent_id = ?", s.ID).Count(&subsystemCount)
			if subsystemCount > 0 {
				return gorm.ErrInvalidValue
			}
		}

		// Cannot change type if systems has builds
		if current.Type == "systems" {
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
		if s.Type != "subsystems" {
			return gorm.ErrInvalidValue
		}

		var parent System
		if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
			return err
		}

		// Parent must be parent_systems type
		if parent.Type != "parent_systems" {
			return gorm.ErrInvalidValue
		}
	} else {
		// If no parent, cannot be subsystem
		if s.Type == "subsystems" {
			return gorm.ErrInvalidValue
		}
	}

	return nil
}

// Helper function to validate system type
func isValidSystemType(t string) bool {
	switch t {
	case "parent_systems", "systems", "subsystems":
		return true
	}
	return false
}
