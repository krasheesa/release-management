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

type BuildHandler struct{}

func NewBuildHandler() *BuildHandler {
	return &BuildHandler{}
}

// GET /builds
func (h *BuildHandler) GetBuilds(c *gin.Context) {
	var dbBuilds []db.Build
	if err := database.DB.Preload("System").Preload("Release").Find(&dbBuilds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch builds"})
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

// GET /builds/:id
func (h *BuildHandler) GetBuild(c *gin.Context) {
	id := c.Param("id")
	var dbBuild db.Build

	if err := database.DB.Preload("System").Preload("Release").First(&dbBuild, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Build not found"})
		return
	}

	domainBuild := mapper.BuildDBToDomain(&dbBuild)
	apiBuild := mapper.BuildDomainToAPI(domainBuild)

	c.JSON(http.StatusOK, apiBuild)
}

// POST /builds
func (h *BuildHandler) CreateBuild(c *gin.Context) {
	var req api.BuildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that System exists
	var system db.System
	if err := database.DB.First(&system, "id = ?", req.SystemID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "System not found"})
		return
	}

	// Validate that only subsystems and systems can have builds (not parent_systems)
	if system.Type == string(domain.SystemTypeParent) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create builds for parent_systems. Only systems and subsystems can have builds"})
		return
	}

	// Only validate Release if ReleaseID is provided
	if req.ReleaseID != nil && *req.ReleaseID != "" {
		var release db.Release
		if err := database.DB.First(&release, "id = ?", *req.ReleaseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
			return
		}

		// Check for duplicate system in the same release
		var existingBuild db.Build
		if err := database.DB.Where("release_id = ? AND system_id = ?", *req.ReleaseID, req.SystemID).First(&existingBuild).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "A build for this system already exists in this release. Each release can only have one build per system"})
			return
		}
	}

	// Convert to domain and then to DB
	domainBuild := mapper.BuildAPIToDomain(&req)
	dbBuild := mapper.BuildDomainToDB(domainBuild)

	if err := database.DB.Create(&dbBuild).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create build"})
		return
	}

	// Load relationships for response
	database.DB.Preload("System").Preload("Release").First(dbBuild, "id = ?", dbBuild.ID)

	// Convert back for response
	savedDomain := mapper.BuildDBToDomain(dbBuild)
	response := mapper.BuildDomainToAPI(savedDomain)

	c.JSON(http.StatusCreated, response)
}

// PUT /builds/:id
func (h *BuildHandler) UpdateBuild(c *gin.Context) {
	id := c.Param("id")
	var dbBuild db.Build

	if err := database.DB.First(&dbBuild, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Build not found"})
		return
	}

	var updateReq api.BuildUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Prevent system_id changes - builds cannot be moved between systems
	if updateReq.SystemID != "" && updateReq.SystemID != dbBuild.SystemID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change system_id of existing build. System ID is immutable after creation"})
		return
	}

	if updateReq.ReleaseID != nil && *updateReq.ReleaseID != "" {
		// Check if ReleaseID is actually changing
		if dbBuild.ReleaseID == nil || *updateReq.ReleaseID != *dbBuild.ReleaseID {
			var release db.Release
			if err := database.DB.First(&release, "id = ?", *updateReq.ReleaseID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
				return
			}

			// Check for duplicate system in the target release (excluding current build)
			var existingBuild db.Build
			if err := database.DB.Where("release_id = ? AND system_id = ? AND id != ?", *updateReq.ReleaseID, dbBuild.SystemID, dbBuild.ID).First(&existingBuild).Error; err == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "A build for this system already exists in the target release. Each release can only have one build per system"})
				return
			}
		}
	}

	// Apply updates
	if updateReq.Version != "" {
		dbBuild.Version = updateReq.Version
	}
	if !updateReq.BuildDate.IsZero() {
		dbBuild.BuildDate = updateReq.BuildDate
	}
	if updateReq.ReleaseID != nil {
		dbBuild.ReleaseID = updateReq.ReleaseID
	}

	if err := database.DB.Save(&dbBuild).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update build"})
		return
	}

	// Load relationships for response
	database.DB.Preload("System").Preload("Release").First(&dbBuild, "id = ?", dbBuild.ID)

	// Convert to response
	domainBuild := mapper.BuildDBToDomain(&dbBuild)
	response := mapper.BuildDomainToAPI(domainBuild)

	c.JSON(http.StatusOK, response)
}

// DELETE /builds/:id
func (h *BuildHandler) DeleteBuild(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&db.Build{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete build"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Build deleted successfully"})
}
