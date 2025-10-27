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

// GET /environments
func (h *EnvironmentHandler) GetEnvironments(c *gin.Context) {
	var environments []models.Environment
	if err := database.DB.Preload("Release").Find(&environments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environments"})
		return
	}
	c.JSON(http.StatusOK, environments)
}

// GET /environments/:id
func (h *EnvironmentHandler) GetEnvironment(c *gin.Context) {
	id := c.Param("id")
	var environment models.Environment

	if err := database.DB.Preload("Release").First(&environment, "id = ?", id).Error; err != nil {
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

	// Validate that Release exists
	var release models.Release
	if err := database.DB.First(&release, "id = ?", environment.ReleaseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
		return
	}

	if err := database.DB.Create(&environment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create environment"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Release").First(&environment, "id = ?", environment.ID)

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

	// Validate that Release exists if it's being updated
	if updates.ReleaseID != "" && updates.ReleaseID != environment.ReleaseID {
		var release models.Release
		if err := database.DB.First(&release, "id = ?", updates.ReleaseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
			return
		}
	}

	// Preserve ID and timestamps
	updates.ID = environment.ID
	updates.CreatedAt = environment.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Release").First(&updates, "id = ?", updates.ID)

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
