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

	// Validate that System and Release exist if they're being updated
	if updates.SystemID != "" && updates.SystemID != build.SystemID {
		var system models.System
		if err := database.DB.First(&system, "id = ?", updates.SystemID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "System not found"})
			return
		}
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

	// Update only the provided fields
	if err := database.DB.Model(&build).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update build"})
		return
	}

	// Load relationships for response
	database.DB.Preload("System").Preload("Release").First(&build, "id = ?", build.ID)

	c.JSON(http.StatusOK, build)
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
