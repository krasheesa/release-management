package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
)

type EnvironmentGroupHandler struct{}

func NewEnvironmentGroupHandler() *EnvironmentGroupHandler {
	return &EnvironmentGroupHandler{}
}

// GET /environment-groups
func (h *EnvironmentGroupHandler) GetEnvironmentGroups(c *gin.Context) {
	var environmentGroups []models.EnvironmentGroup
	if err := database.DB.Preload("Environments").Find(&environmentGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment groups"})
		return
	}
	c.JSON(http.StatusOK, environmentGroups)
}

// GET /environment-groups/:id
func (h *EnvironmentGroupHandler) GetEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")
	var environmentGroup models.EnvironmentGroup

	if err := database.DB.Preload("Environments").First(&environmentGroup, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment Group not found"})
		return
	}

	c.JSON(http.StatusOK, environmentGroup)
}

// POST /environment-groups
func (h *EnvironmentGroupHandler) CreateEnvironmentGroup(c *gin.Context) {
	var environmentGroup models.EnvironmentGroup
	if err := c.ShouldBindJSON(&environmentGroup); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&environmentGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create environment group"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Environments").First(&environmentGroup, "id = ?", environmentGroup.ID)

	c.JSON(http.StatusCreated, environmentGroup)
}

// PUT /environment-groups/:id
func (h *EnvironmentGroupHandler) UpdateEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")
	var environmentGroup models.EnvironmentGroup

	if err := database.DB.First(&environmentGroup, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment Group not found"})
		return
	}

	var updates models.EnvironmentGroup
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Preserve ID and timestamps
	updates.ID = environmentGroup.ID
	updates.CreatedAt = environmentGroup.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment group"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Environments").First(&updates, "id = ?", updates.ID)

	c.JSON(http.StatusOK, updates)
}

// DELETE /environment-groups/:id
func (h *EnvironmentGroupHandler) DeleteEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")

	// Check if environment group has associated environments
	var environmentCount int64
	database.DB.Model(&models.Environment{}).Where("environment_group_id = ?", id).Count(&environmentCount)

	if environmentCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete environment group that has associated environments. Please reassign or delete environments first."})
		return
	}

	if err := database.DB.Delete(&models.EnvironmentGroup{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete environment group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Environment group deleted successfully"})
}
