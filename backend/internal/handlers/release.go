package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
)

type ReleaseHandler struct{}

func NewReleaseHandler() *ReleaseHandler {
	return &ReleaseHandler{}
}

// GET /releases
func (h *ReleaseHandler) GetReleases(c *gin.Context) {
	var releases []models.Release
	if err := database.DB.Find(&releases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch releases"})
		return
	}
	c.JSON(http.StatusOK, releases)
}

// GET /releases/:id
func (h *ReleaseHandler) GetRelease(c *gin.Context) {
	id := c.Param("id")
	var release models.Release

	if err := database.DB.First(&release, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Release not found"})
		return
	}

	c.JSON(http.StatusOK, release)
}

// POST /releases
func (h *ReleaseHandler) CreateRelease(c *gin.Context) {
	var release models.Release
	if err := c.ShouldBindJSON(&release); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&release).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create release"})
		return
	}

	c.JSON(http.StatusCreated, release)
}

// PUT /releases/:id
func (h *ReleaseHandler) UpdateRelease(c *gin.Context) {
	id := c.Param("id")
	var release models.Release

	if err := database.DB.First(&release, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Release not found"})
		return
	}

	var updates models.Release
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Preserve ID and timestamps
	updates.ID = release.ID
	updates.CreatedAt = release.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update release"})
		return
	}

	c.JSON(http.StatusOK, updates)
}

// DELETE /releases/:id
func (h *ReleaseHandler) DeleteRelease(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Release{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete release"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Release deleted successfully"})
}

// GET /releases/:id/builds
func (h *ReleaseHandler) GetReleaseBuilds(c *gin.Context) {
	id := c.Param("id")
	var builds []models.Build

	if err := database.DB.Where("release_id = ?", id).Preload("System").Find(&builds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch release builds"})
		return
	}

	c.JSON(http.StatusOK, builds)
}
