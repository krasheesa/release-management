package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
)

type EnvironmentHandler struct{}

func NewEnvironmentHandler() *EnvironmentHandler {
	return &EnvironmentHandler{}
}

// Helper function to validate environment status
func isValidEnvironmentStatus(status models.EnvironmentStatus) bool {
	switch status {
	case models.EnvStatusActive, models.EnvStatusDecommissioned, models.EnvStatusMaintenance, models.EnvStatusPending:
		return true
	default:
		return false
	}
}

// GET /environments
func (h *EnvironmentHandler) GetEnvironments(c *gin.Context) {
	var environments []models.Environment
	if err := database.DB.Find(&environments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environments"})
		return
	}
	c.JSON(http.StatusOK, environments)
}

// GET /environments/:id
func (h *EnvironmentHandler) GetEnvironment(c *gin.Context) {
	id := c.Param("id")
	var environment models.Environment

	if err := database.DB.First(&environment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
		return
	}

	c.JSON(http.StatusOK, environment)
}

// POST /environments
func (h *EnvironmentHandler) CreateEnvironment(c *gin.Context) {
	var environment models.Environment
	if err := c.ShouldBindJSON(&environment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if !isValidEnvironmentStatus(environment.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment status. Valid values are: active, decommissioned, maintenance, pending"})
		return
	}

	// Validate that Release exists
	var release models.Release
	if err := database.DB.First(&release, "id = ?", environment.ReleaseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
		return
	}

	// Validate that EnvironmentGroup exists if provided
	if environment.EnvironmentGroupID != nil && *environment.EnvironmentGroupID != "" {
		var envGroup models.EnvironmentGroup
		if err := database.DB.First(&envGroup, "id = ?", *environment.EnvironmentGroupID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Environment Group not found"})
			return
		}
	}

	if err := database.DB.Create(&environment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create environment"})
		return
	}

	// Load the created environment for response
	database.DB.First(&environment, "id = ?", environment.ID)

	c.JSON(http.StatusCreated, environment)
}

// PUT /environments/:id
func (h *EnvironmentHandler) UpdateEnvironment(c *gin.Context) {
	id := c.Param("id")
	var environment models.Environment

	if err := database.DB.First(&environment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
		return
	}

	var updates models.Environment
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status if provided
	if updates.Status != "" && !isValidEnvironmentStatus(updates.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment status. Valid values are: active, decommissioned, maintenance, pending"})
		return
	}

	// Validate that Release exists if it's being updated
	if updates.ReleaseID != "" && updates.ReleaseID != environment.ReleaseID {
		var release models.Release
		if err := database.DB.First(&release, "id = ?", updates.ReleaseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
			return
		}
	}

	// Validate that EnvironmentGroup exists if it's being updated
	if updates.EnvironmentGroupID != nil && *updates.EnvironmentGroupID != "" {
		// Check if EnvironmentGroupID is actually changing
		if environment.EnvironmentGroupID == nil || *updates.EnvironmentGroupID != *environment.EnvironmentGroupID {
			var envGroup models.EnvironmentGroup
			if err := database.DB.First(&envGroup, "id = ?", *updates.EnvironmentGroupID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Environment Group not found"})
				return
			}
		}
	}

	// Preserve ID and timestamps
	updates.ID = environment.ID
	updates.CreatedAt = environment.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment"})
		return
	}

	// Load the updated environment for response
	database.DB.First(&updates, "id = ?", updates.ID)

	c.JSON(http.StatusOK, updates)
}

// DELETE /environments/:id
func (h *EnvironmentHandler) DeleteEnvironment(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Environment{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete environment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Environment deleted successfully"})
}
