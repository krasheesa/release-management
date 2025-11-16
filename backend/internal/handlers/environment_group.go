package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/mapper"

	"github.com/gin-gonic/gin"
)

type EnvironmentGroupHandler struct{}

func NewEnvironmentGroupHandler() *EnvironmentGroupHandler {
	return &EnvironmentGroupHandler{}
}

// GET /environment-groups
func (h *EnvironmentGroupHandler) GetEnvironmentGroups(c *gin.Context) {
	var dbGroups []db.EnvironmentGroup
	if err := database.DB.Preload("Environments").Find(&dbGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment groups"})
		return
	}

	// Convert to API responses
	apiGroups := make([]api.EnvironmentGroupResponse, len(dbGroups))
	for i, dbGroup := range dbGroups {
		domainGroup := mapper.EnvironmentGroupDBToDomain(&dbGroup)
		apiGroup := mapper.EnvironmentGroupDomainToAPI(domainGroup)
		apiGroups[i] = *apiGroup
	}

	c.JSON(http.StatusOK, apiGroups)
}

// GET /environment-groups/:id
func (h *EnvironmentGroupHandler) GetEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")
	var dbGroup db.EnvironmentGroup

	if err := database.DB.Preload("Environments").First(&dbGroup, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment Group not found"})
		return
	}

	domainGroup := mapper.EnvironmentGroupDBToDomain(&dbGroup)
	apiGroup := mapper.EnvironmentGroupDomainToAPI(domainGroup)

	c.JSON(http.StatusOK, apiGroup)
}

// POST /environment-groups
func (h *EnvironmentGroupHandler) CreateEnvironmentGroup(c *gin.Context) {
	var req api.EnvironmentGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert to domain and then to DB
	domainGroup := mapper.EnvironmentGroupAPIToDomain(&req)
	dbGroup := mapper.EnvironmentGroupDomainToDB(domainGroup)

	if err := database.DB.Create(&dbGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create environment group"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Environments").First(dbGroup, "id = ?", dbGroup.ID)

	// Convert back for response
	savedDomain := mapper.EnvironmentGroupDBToDomain(dbGroup)
	response := mapper.EnvironmentGroupDomainToAPI(savedDomain)

	c.JSON(http.StatusCreated, response)
}

// PUT /environment-groups/:id
func (h *EnvironmentGroupHandler) UpdateEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")
	var dbGroup db.EnvironmentGroup

	if err := database.DB.First(&dbGroup, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment Group not found"})
		return
	}

	var updateReq api.EnvironmentGroupUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Apply updates
	if updateReq.Name != "" {
		dbGroup.Name = updateReq.Name
	}
	if updateReq.Description != nil {
		dbGroup.Description = updateReq.Description
	}

	if err := database.DB.Save(&dbGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment group"})
		return
	}

	// Load relationships for response
	database.DB.Preload("Environments").First(&dbGroup, "id = ?", dbGroup.ID)

	// Convert to response
	domainGroup := mapper.EnvironmentGroupDBToDomain(&dbGroup)
	response := mapper.EnvironmentGroupDomainToAPI(domainGroup)

	c.JSON(http.StatusOK, response)
}

// DELETE /environment-groups/:id
func (h *EnvironmentGroupHandler) DeleteEnvironmentGroup(c *gin.Context) {
	id := c.Param("id")

	// Check if environment group has associated environments
	var environmentCount int64
	database.DB.Model(&db.Environment{}).Where("environment_group_id = ?", id).Count(&environmentCount)

	if environmentCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete environment group that has associated environments. Please reassign or delete environments first."})
		return
	}

	if err := database.DB.Delete(&db.EnvironmentGroup{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete environment group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Environment group deleted successfully"})
}
