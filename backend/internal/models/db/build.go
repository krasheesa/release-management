package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Build represents the build table in the database
type Build struct {
	ID        string  `gorm:"primaryKey;type:varchar(36)"`
	SystemID  string  `gorm:"type:varchar(36);not null"`
	ReleaseID *string `gorm:"type:varchar(36)"`
	Version   string  `gorm:"not null"`
	BuildDate time.Time
	CreatedAt time.Time
	UpdatedAt time.Time

	// Relationships for GORM
	System  System   `gorm:"foreignKey:SystemID"`
	Release *Release `gorm:"foreignKey:ReleaseID"`
}

// TableName specifies the table name for GORM
func (Build) TableName() string {
	return "builds"
}

// BeforeCreate hook for GORM
func (b *Build) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	if b.CreatedAt.IsZero() {
		b.CreatedAt = time.Now()
	}
	if b.UpdatedAt.IsZero() {
		b.UpdatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate hook for GORM
func (b *Build) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}
