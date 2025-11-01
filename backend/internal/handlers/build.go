package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
)

type BuildHandler struct{}

func NewBuildHandler() *BuildHandler {
	return &BuildHandler{}
}

// GET /builds
func (h *BuildHandler) GetBuilds(c *gin.Context) {
	var builds []models.Build
	if err := database.DB.Preload("System").Preload("Release").Find(&builds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch builds"})
		return
	}
	c.JSON(http.StatusOK, builds)
}

// GET /builds/:id
func (h *BuildHandler) GetBuild(c *gin.Context) {
	id := c.Param("id")
	var build models.Build

	if err := database.DB.Preload("System").Preload("Release").First(&build, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Build not found"})
		return
	}

	c.JSON(http.StatusOK, build)
}

// POST /builds
func (h *BuildHandler) CreateBuild(c *gin.Context) {
	var build models.Build
	if err := c.ShouldBindJSON(&build); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that System exists
	var system models.System
	if err := database.DB.First(&system, "id = ?", build.SystemID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "System not found"})
		return
	}

	// Validate that only subsystems and systems can have builds (not parent_systems)
	if system.Type == models.SystemTypeParent {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create builds for parent_systems. Only systems and subsystems can have builds"})
		return
	}

	// Only validate Release if ReleaseID is provided
	if build.ReleaseID != nil && *build.ReleaseID != "" {
		var release models.Release
		if err := database.DB.First(&release, "id = ?", *build.ReleaseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
			return
		}
	}

	if err := database.DB.Create(&build).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create build"})
		return
	}

	// Load relationships for response
	database.DB.Preload("System").Preload("Release").First(&build, "id = ?", build.ID)

	c.JSON(http.StatusCreated, build)
}

// PUT /builds/:id
func (h *BuildHandler) UpdateBuild(c *gin.Context) {
	id := c.Param("id")
	var build models.Build

	if err := database.DB.First(&build, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Build not found"})
		return
	}

	var updates models.Build
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Prevent system_id changes - builds cannot be moved between systems
	if updates.SystemID != "" && updates.SystemID != build.SystemID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change system_id of existing build. System ID is immutable after creation"})
		return
	}

	if updates.ReleaseID != nil && *updates.ReleaseID != "" {
		// Check if ReleaseID is actually changing
		if build.ReleaseID == nil || *updates.ReleaseID != *build.ReleaseID {
			var release models.Release
			if err := database.DB.First(&release, "id = ?", *updates.ReleaseID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
				return
			}
		}
	}

	// Preserve ID, SystemID and timestamps
	updates.ID = build.ID
	updates.SystemID = build.SystemID  // Ensure system_id cannot be changed
	updates.CreatedAt = build.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update build"})
		return
	}

	// Load relationships for response
	database.DB.Preload("System").Preload("Release").First(&updates, "id = ?", updates.ID)

	c.JSON(http.StatusOK, updates)
}

// DELETE /builds/:id
func (h *BuildHandler) DeleteBuild(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Build{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete build"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Build deleted successfully"})
}
