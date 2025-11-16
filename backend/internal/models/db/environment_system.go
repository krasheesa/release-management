package db

import (
	"time"

	"gorm.io/gorm"
)

// EnvironmentSystem represents the environment_systems table in the database
type EnvironmentSystem struct {
	ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	EnvironmentID string    `gorm:"type:uuid;not null;index"`
	SystemID      string    `gorm:"type:uuid;not null;index"`
	Version       string    `gorm:"type:varchar(50)"`
	Status        string    `gorm:"type:varchar(20);default:'active'"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`

	// Relationships for GORM
	Environment Environment `gorm:"foreignKey:EnvironmentID"`
	System      System      `gorm:"foreignKey:SystemID"`
}

// TableName specifies the table name for GORM
func (EnvironmentSystem) TableName() string {
	return "environment_systems"
}

// BeforeCreate hook for GORM
func (es *EnvironmentSystem) BeforeCreate(tx *gorm.DB) error {
	if es.Status == "" {
		es.Status = "active"
	}
	return nil
}
