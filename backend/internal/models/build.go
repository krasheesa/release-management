package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Build struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	SystemID  string    `json:"system_id" gorm:"type:varchar(36);not null"`
	ReleaseID *string   `json:"release_id,omitempty" gorm:"type:varchar(36)"`
	Version   string    `json:"version" gorm:"not null"`
	BuildDate time.Time `json:"build_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	System  System   `json:"system,omitempty" gorm:"foreignKey:SystemID"`
	Release *Release `json:"release,omitempty" gorm:"foreignKey:ReleaseID"`
}

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

func (b *Build) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}
