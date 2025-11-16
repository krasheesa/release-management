package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Release represents the release table in the database
type Release struct {
	ID          string `gorm:"primaryKey;type:varchar(36)"`
	Name        string `gorm:"not null"`
	Description *string
	ReleaseDate time.Time
	Status      string `gorm:"type:varchar(20);default:'planned'"`
	Type        string `gorm:"type:varchar(10);not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time

	// Relationships for GORM
	Builds       []Build       `gorm:"foreignKey:ReleaseID"`
	Environments []Environment `gorm:"foreignKey:ReleaseID"`
}

// TableName specifies the table name for GORM
func (Release) TableName() string {
	return "releases"
}

// BeforeCreate hook for GORM
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

// BeforeUpdate hook for GORM
func (r *Release) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = time.Now()
	return nil
}
