package db

import (
	"time"

	"gorm.io/gorm"
)

// User represents the user table in the database
type Roles struct {
	ID        uint   `gorm:"primaryKey"`
	RoleName  string `gorm:"unique;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type RoleAccess struct {
	ID        uint   `gorm:"primaryKey"`
	RoleID    uint   `gorm:"not null;index:idx_role_access_unique,unique"`
	Role      Roles  `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE"`
	AccessID  uint   `gorm:"not null;index:idx_role_access_unique,unique"`
	Access    Access `gorm:"foreignKey:AccessID;constraint:OnDelete:CASCADE"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Access struct {
	ID         uint   `gorm:"primaryKey"`
	AccessName string `gorm:"unique;not null"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// TableName specifies the table name for GORM
func (Roles) TableName() string {
	return "roles"
}

func (RoleAccess) TableName() string {
	return "role_access"
}

func (Access) TableName() string {
	return "access"
}

func (u *Roles) BeforeCreate(tx *gorm.DB) error {
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	if u.UpdatedAt.IsZero() {
		u.UpdatedAt = time.Now()
	}
	return nil
}

func (u *RoleAccess) BeforeCreate(tx *gorm.DB) error {
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	if u.UpdatedAt.IsZero() {
		u.UpdatedAt = time.Now()
	}
	return nil
}

func (u *Access) BeforeCreate(tx *gorm.DB) error {
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	if u.UpdatedAt.IsZero() {
		u.UpdatedAt = time.Now()
	}
	return nil
}
