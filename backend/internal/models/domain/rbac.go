package domain

import "time"

type AccessName string

const (
	AccessCreate AccessName = "create"
	AccessRead   AccessName = "read"
	AccessUpdate AccessName = "update"
	AccessDelete AccessName = "delete"
)

type Roles struct {
	ID        uint   `gorm:"primaryKey"`
	RoleName  string `gorm:"unique;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type RoleAccess struct {
	ID        uint `gorm:"primaryKey"`
	RoleID    uint `gorm:"not null"`
	AccessID  uint `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Access struct {
	AccessID   uint `gorm:"primaryKey"`
	AccessName AccessName
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
