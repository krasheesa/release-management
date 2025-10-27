package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
)

type SystemHandler struct{}

func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// GET /systems
func (h *SystemHandler) GetSystems(c *gin.Context) {
	var systems []models.System
	if err := database.DB.Find(&systems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch systems"})
		return
	}
	c.JSON(http.StatusOK, systems)
}

// GET /systems/:id
func (h *SystemHandler) GetSystem(c *gin.Context) {
	id := c.Param("id")
	var system models.System

	if err := database.DB.Preload("Parent").First(&system, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System not found"})
		return
	}

	c.JSON(http.StatusOK, system)
}

// POST /systems
func (h *SystemHandler) CreateSystem(c *gin.Context) {
	var system models.System
	if err := c.ShouldBindJSON(&system); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate 2-level hierarchy: if parent_id is provided, ensure the parent is a root system
	if system.ParentID != nil && *system.ParentID != "" {
		var parent models.System
		if err := database.DB.First(&parent, "id = ?", *system.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Check if the parent system already has a parent (is a subsystem)
		if parent.ParentID != nil && *parent.ParentID != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create subsystem under a subsystem. Only 2-level hierarchy is allowed (System -> Subsystem)"})
			return
		}
	}

	if err := database.DB.Create(&system).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create system"})
		return
	}

	c.JSON(http.StatusCreated, system)
}

// PUT /systems/:id
func (h *SystemHandler) UpdateSystem(c *gin.Context) {
	id := c.Param("id")
	var system models.System

	if err := database.DB.First(&system, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System not found"})
		return
	}

	var updates models.System
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate 2-level hierarchy: if parent_id is being updated, ensure the parent is a root system
	if updates.ParentID != nil && *updates.ParentID != "" {
		var parent models.System
		if err := database.DB.First(&parent, "id = ?", *updates.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Check if the parent system already has a parent (is a subsystem)
		if parent.ParentID != nil && *parent.ParentID != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot move system under a subsystem. Only 2-level hierarchy is allowed (System -> Subsystem)"})
			return
		}
	}

	// Check if this system has subsystems and is being moved under a parent
	if updates.ParentID != nil && *updates.ParentID != "" {
		var subsystemCount int64
		database.DB.Model(&models.System{}).Where("parent_id = ?", id).Count(&subsystemCount)
		if subsystemCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot move a system with subsystems under another system. Only 2-level hierarchy is allowed"})
			return
		}
	}

	// Preserve ID and timestamps
	updates.ID = system.ID
	updates.CreatedAt = system.CreatedAt

	if err := database.DB.Save(&updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update system"})
		return
	}

	c.JSON(http.StatusOK, updates)
}

// DELETE /systems/:id
func (h *SystemHandler) DeleteSystem(c *gin.Context) {
	id := c.Param("id")

	// Check if the system has subsystems
	var subsystemCount int64
	if err := database.DB.Model(&models.System{}).Where("parent_id = ?", id).Count(&subsystemCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for subsystems"})
		return
	}

	if subsystemCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete system with subsystems. Please delete subsystems first"})
		return
	}

	if err := database.DB.Delete(&models.System{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete system"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "System deleted successfully"})
}

// GET /systems/:id/subsystems
func (h *SystemHandler) GetSubsystems(c *gin.Context) {
	id := c.Param("id")
	var subsystems []models.System

	if err := database.DB.Where("parent_id = ?", id).Find(&subsystems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subsystems"})
		return
	}

	c.JSON(http.StatusOK, subsystems)
}
