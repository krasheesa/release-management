package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
	"release-management/internal/models/mapper"

	"github.com/gin-gonic/gin"
)

type SystemHandler struct{}

func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// GET /systems
func (h *SystemHandler) GetSystems(c *gin.Context) {
	var dbSystems []db.System
	if err := database.DB.Find(&dbSystems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch systems"})
		return
	}

	// Convert to API responses
	apiSystems := make([]api.SystemResponse, len(dbSystems))
	for i, dbSys := range dbSystems {
		domainSys := mapper.SystemDBToDomain(&dbSys)
		apiSys := mapper.SystemDomainToAPI(domainSys)
		apiSystems[i] = *apiSys
	}

	c.JSON(http.StatusOK, apiSystems)
}

// GET /systems/:id
func (h *SystemHandler) GetSystem(c *gin.Context) {
	id := c.Param("id")
	var dbSys db.System

	if err := database.DB.Preload("Parent").First(&dbSys, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System not found"})
		return
	}

	domainSys := mapper.SystemDBToDomain(&dbSys)
	apiSys := mapper.SystemDomainToAPI(domainSys)

	c.JSON(http.StatusOK, apiSys)
}

// POST /systems
func (h *SystemHandler) CreateSystem(c *gin.Context) {
	var req api.SystemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate type is provided
	if req.Type == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type is required"})
		return
	}

	// Validate type value
	sysType := domain.SystemType(req.Type)
	if !sysType.IsValid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Must be one of: parent_systems, systems, subsystems"})
		return
	}

	if req.Status == "" {
		req.Status = string(domain.StatusActive)
	}

	// Validate type consistency with parent_id
	if req.ParentID != nil && *req.ParentID != "" {
		// If has parent, must be subsystem
		if req.Type != string(domain.SystemTypeSubsystem) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "System with parent must be of type 'subsystems'"})
			return
		}

		var parent db.System
		if err := database.DB.First(&parent, "id = ?", *req.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Parent must be parent_systems type
		if parent.Type != string(domain.SystemTypeParent) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system must be of type 'parent_systems'"})
			return
		}
	} else {
		// If no parent, cannot be subsystem
		if req.Type == string(domain.SystemTypeSubsystem) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Subsystem must have a parent system"})
			return
		}
	}

	// Convert to domain and then to DB
	domainSys := mapper.SystemAPIToDomain(&req)
	dbSys := mapper.SystemDomainToDB(domainSys)

	if err := database.DB.Create(&dbSys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create system"})
		return
	}

	// Convert back for response
	savedDomain := mapper.SystemDBToDomain(dbSys)
	response := mapper.SystemDomainToAPI(savedDomain)

	c.JSON(http.StatusCreated, response)
}

// PUT /systems/:id
func (h *SystemHandler) UpdateSystem(c *gin.Context) {
	id := c.Param("id")
	var dbSys db.System

	if err := database.DB.First(&dbSys, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System not found"})
		return
	}

	var updateReq api.SystemUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate type if provided
	if updateReq.Type != "" {
		sysType := domain.SystemType(updateReq.Type)
		if !sysType.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Must be one of: parent_systems, systems, subsystems"})
			return
		}
	}

	// Validate status if provided
	if updateReq.Status != "" {
		status := updateReq.Status
		if status != string(domain.StatusActive) && status != string(domain.StatusDeprecated) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be 'active' or 'deprecated'"})
			return
		}
	}

	// Check if type can be changed
	if updateReq.Type != "" && dbSys.Type != updateReq.Type {
		// Cannot change type if parent_systems has subsystems
		if dbSys.Type == string(domain.SystemTypeParent) {
			var subsystemCount int64
			database.DB.Model(&db.System{}).Where("parent_id = ?", id).Count(&subsystemCount)
			if subsystemCount > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change type of parent_systems that has subsystems"})
				return
			}
		}

		// Cannot change type if systems has builds
		if dbSys.Type == string(domain.SystemTypeSystem) {
			var buildCount int64
			database.DB.Model(&db.Build{}).Where("system_id = ?", id).Count(&buildCount)
			if buildCount > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change type of systems that has builds associated with it"})
				return
			}
		}
	}

	// Modifying parent systems status - update subsystems to match
	if updateReq.Status != "" && dbSys.Status != updateReq.Status && dbSys.Type == string(domain.SystemTypeParent) {
		var subsystems []db.System
		if err := database.DB.Where("parent_id = ?", id).Find(&subsystems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subsystems for status update"})
			return
		}

		for _, subsystem := range subsystems {
			if subsystem.Status != updateReq.Status {
				subsystem.Status = updateReq.Status
				if err := database.DB.Save(&subsystem).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subsystem status: " + err.Error()})
					return
				}
			}
		}
	}

	// Validate type consistency with parent_id
	if updateReq.ParentID != nil && *updateReq.ParentID != "" {
		// If has parent, must be subsystem
		newType := dbSys.Type
		if updateReq.Type != "" {
			newType = updateReq.Type
		}

		if newType != string(domain.SystemTypeSubsystem) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "System with parent must be of type 'subsystems'"})
			return
		}

		var parent db.System
		if err := database.DB.First(&parent, "id = ?", *updateReq.ParentID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
			return
		}

		// Parent must be parent_systems type
		if parent.Type != string(domain.SystemTypeParent) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system must be of type 'parent_systems'"})
			return
		}
	} else if (updateReq.ParentID == nil || (updateReq.ParentID != nil && *updateReq.ParentID == "")) && updateReq.Type != "" {
		// If no parent, cannot be subsystem
		if updateReq.Type == string(domain.SystemTypeSubsystem) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Subsystem must have a parent system"})
			return
		}
	}

	// Check if this system has subsystems and is being moved under a parent
	if updateReq.ParentID != nil && *updateReq.ParentID != "" {
		var subsystemCount int64
		database.DB.Model(&db.System{}).Where("parent_id = ?", id).Count(&subsystemCount)
		if subsystemCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot move a system with subsystems under another system"})
			return
		}
	}

	// Apply updates
	if updateReq.Name != "" {
		dbSys.Name = updateReq.Name
	}
	if updateReq.Type != "" {
		dbSys.Type = updateReq.Type
	}
	if updateReq.Status != "" {
		dbSys.Status = updateReq.Status
	}
	if updateReq.ParentID != nil {
		dbSys.ParentID = updateReq.ParentID
	}
	if updateReq.Description != nil {
		dbSys.Description = updateReq.Description
	}

	if err := database.DB.Save(&dbSys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update system"})
		return
	}

	// Convert to response
	domainSys := mapper.SystemDBToDomain(&dbSys)
	response := mapper.SystemDomainToAPI(domainSys)

	c.JSON(http.StatusOK, response)
}

// DELETE /systems/:id
func (h *SystemHandler) DeleteSystem(c *gin.Context) {
	id := c.Param("id")

	// Check if the system has subsystems
	var subsystemCount int64
	if err := database.DB.Model(&db.System{}).Where("parent_id = ?", id).Count(&subsystemCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for subsystems"})
		return
	}

	if subsystemCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete system with subsystems. Please delete subsystems first"})
		return
	}

	if err := database.DB.Delete(&db.System{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete system"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "System deleted successfully"})
}

// GET /systems/:id/subsystems
func (h *SystemHandler) GetSubsystems(c *gin.Context) {
	id := c.Param("id")
	var dbSubsystems []db.System

	if err := database.DB.Where("parent_id = ?", id).Find(&dbSubsystems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subsystems"})
		return
	}

	// Convert to API responses
	apiSubsystems := make([]api.SystemResponse, len(dbSubsystems))
	for i, dbSub := range dbSubsystems {
		domainSub := mapper.SystemDBToDomain(&dbSub)
		apiSub := mapper.SystemDomainToAPI(domainSub)
		apiSubsystems[i] = *apiSub
	}

	c.JSON(http.StatusOK, apiSubsystems)
}

// GET /systems/:id/builds
func (h *SystemHandler) GetSystemBuilds(c *gin.Context) {
	id := c.Param("id")
	var dbBuilds []db.Build

	if err := database.DB.Where("system_id = ?", id).Preload("System").Find(&dbBuilds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch release builds"})
		return
	}

	// Convert to API responses
	apiBuilds := make([]api.BuildResponse, len(dbBuilds))
	for i, dbBuild := range dbBuilds {
		domainBuild := mapper.BuildDBToDomain(&dbBuild)
		apiBuild := mapper.BuildDomainToAPI(domainBuild)
		apiBuilds[i] = *apiBuild
	}

	c.JSON(http.StatusOK, apiBuilds)
}
