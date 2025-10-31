package models

import (
	"time"

	"gorm.io/gorm"
)

type EnvironmentSystem struct {
	ID            string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	EnvironmentID string    `json:"environment_id" gorm:"type:uuid;not null;index"`
	SystemID      string    `json:"system_id" gorm:"type:uuid;not null;index"`
	Version       string    `json:"version" gorm:"type:varchar(50)"`
	Status        string    `json:"status" gorm:"type:varchar(20);default:'active'"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Environment Environment `json:"environment,omitempty" gorm:"foreignKey:EnvironmentID"`
	System      System      `json:"system,omitempty" gorm:"foreignKey:SystemID"`
}

type EnvironmentSystemRequest struct {
	SystemID string `json:"system_id" binding:"required"`
	Version  string `json:"version,omitempty"`
	Status   string `json:"status,omitempty"`
}

type EnvironmentSystemUpdate struct {
	Version string `json:"version,omitempty"`
	Status  string `json:"status,omitempty"`
}

type EnvironmentSystemResponse struct {
	ID            string       `json:"id"`
	EnvironmentID string       `json:"environment_id"`
	SystemID      string       `json:"system_id"`
	Version       string       `json:"version"`
	Status        string       `json:"status"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	System        *System      `json:"system,omitempty"`
	Environment   *Environment `json:"environment,omitempty"`
}

type SimpleSystemInfo struct {
	SystemID   string `json:"system_id"`
	SystemName string `json:"system_name"`
	Status     string `json:"status"`
	Version    string `json:"version"`
}

type EnvironmentSystemsResponse struct {
	EnvironmentID   string             `json:"environment_id"`
	EnvironmentName string             `json:"environment_name"`
	Systems         []SimpleSystemInfo `json:"systems"`
}

func (es *EnvironmentSystem) BeforeCreate(tx *gorm.DB) error {
	if es.Status == "" {
		es.Status = "active"
	}
	return nil
}

func (es *EnvironmentSystem) ToResponse() EnvironmentSystemResponse {
	response := EnvironmentSystemResponse{
		ID:            es.ID,
		EnvironmentID: es.EnvironmentID,
		SystemID:      es.SystemID,
		Version:       es.Version,
		Status:        es.Status,
		CreatedAt:     es.CreatedAt,
		UpdatedAt:     es.UpdatedAt,
	}

	if es.System.ID != "" {
		response.System = &es.System
	}

	if es.Environment.ID != "" {
		response.Environment = &es.Environment
	}

	return response
}
