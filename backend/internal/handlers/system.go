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

	// Validate type is provided
	if system.Type == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type is required"})
		return
	}

	// Validate type value
	if !system.Type.IsValid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Must be one of: parent_systems, systems, subsystems"})
		return
	}

	// Validate type consistency with parent_id
	if system.ParentID != nil && *system.ParentID != "" {
		// If has parent, must be subsystem
		if system.Type != models.SystemTypeSubsystem {
			c.JSON(http.StatusBadRequest, gin.H{"error": "System with parent must be of type 'subsystems'"})
			return
		}

		var parent models.System
		if err := database.DB.First(&parent, "id = ?", *system.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Parent must be parent_systems type
		if parent.Type != models.SystemTypeParent {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system must be of type 'parent_systems'"})
			return
		}
	} else {
		// If no parent, cannot be subsystem
		if system.Type == models.SystemTypeSubsystem {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Subsystem must have a parent system"})
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

	// Validate type if provided
	if updates.Type != "" && !updates.Type.IsValid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Must be one of: parent_systems, systems, subsystems"})
		return
	}

	// Check if type can be changed
	if updates.Type != "" && system.Type != updates.Type {
		// Cannot change type if parent_systems has subsystems
		if system.Type == models.SystemTypeParent {
			var subsystemCount int64
			database.DB.Model(&models.System{}).Where("parent_id = ?", id).Count(&subsystemCount)
			if subsystemCount > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change type of parent_systems that has subsystems"})
				return
			}
		}

		// Cannot change type if systems has builds
		if system.Type == models.SystemTypeSystem {
			var buildCount int64
			database.DB.Model(&models.Build{}).Where("system_id = ?", id).Count(&buildCount)
			if buildCount > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change type of systems that has builds associated with it"})
				return
			}
		}
	}

	// Use current type if not provided in updates
	if updates.Type == "" {
		updates.Type = system.Type
	}

	// Validate type consistency with parent_id
	if updates.ParentID != nil && *updates.ParentID != "" {
		// If has parent, must be subsystem
		if updates.Type != models.SystemTypeSubsystem {
			c.JSON(http.StatusBadRequest, gin.H{"error": "System with parent must be of type 'subsystems'"})
			return
		}

		var parent models.System
		if err := database.DB.First(&parent, "id = ?", *updates.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Parent must be parent_systems type
		if parent.Type != models.SystemTypeParent {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system must be of type 'parent_systems'"})
			return
		}
	} else {
		// If no parent, cannot be subsystem
		if updates.Type == models.SystemTypeSubsystem {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Subsystem must have a parent system"})
			return
		}
	}

	// Check if this system has subsystems and is being moved under a parent
	if updates.ParentID != nil && *updates.ParentID != "" {
		var subsystemCount int64
		database.DB.Model(&models.System{}).Where("parent_id = ?", id).Count(&subsystemCount)
		if subsystemCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot move a system with subsystems under another system"})
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
