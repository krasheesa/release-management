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

type EnvironmentHandler struct{}

func NewEnvironmentHandler() *EnvironmentHandler {
	return &EnvironmentHandler{}
}

// Helper function to validate environment status
func isValidEnvironmentStatus(status domain.EnvironmentStatus) bool {
	switch status {
	case domain.EnvStatusActive, domain.EnvStatusDecommissioned, domain.EnvStatusMaintenance, domain.EnvStatusPending:
		return true
	default:
		return false
	}
}

// GET /environments
func (h *EnvironmentHandler) GetEnvironments(c *gin.Context) {
	var dbEnvs []db.Environment
	if err := database.DB.Find(&dbEnvs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environments"})
		return
	}

	// Convert to API responses
	apiEnvs := make([]api.EnvironmentResponse, len(dbEnvs))
	for i, dbEnv := range dbEnvs {
		domainEnv := mapper.EnvironmentDBToDomain(&dbEnv)
		apiEnv := mapper.EnvironmentDomainToAPI(domainEnv)
		apiEnvs[i] = *apiEnv
	}

	c.JSON(http.StatusOK, apiEnvs)
}

// GET /environments/:id
func (h *EnvironmentHandler) GetEnvironment(c *gin.Context) {
	id := c.Param("id")
	var dbEnv db.Environment

	if err := database.DB.First(&dbEnv, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
		return
	}

	domainEnv := mapper.EnvironmentDBToDomain(&dbEnv)
	apiEnv := mapper.EnvironmentDomainToAPI(domainEnv)

	c.JSON(http.StatusOK, apiEnv)
}

// POST /environments
func (h *EnvironmentHandler) CreateEnvironment(c *gin.Context) {
	var req api.EnvironmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	status := domain.EnvironmentStatus(req.Status)
	if !isValidEnvironmentStatus(status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment status. Valid values are: active, decommissioned, maintenance, pending"})
		return
	}

	// Validate that Release exists
	var release db.Release
	if err := database.DB.First(&release, "id = ?", req.ReleaseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
		return
	}

	// Validate that EnvironmentGroup exists if provided
	if req.EnvironmentGroupID != nil && *req.EnvironmentGroupID != "" {
		var envGroup db.EnvironmentGroup
		if err := database.DB.First(&envGroup, "id = ?", *req.EnvironmentGroupID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Environment Group not found"})
			return
		}
	}

	// Convert to domain and then to DB
	domainEnv := mapper.EnvironmentAPIToDomain(&req)
	dbEnv := mapper.EnvironmentDomainToDB(domainEnv)

	if err := database.DB.Create(&dbEnv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create environment"})
		return
	}

	// Load the created environment for response
	database.DB.First(dbEnv, "id = ?", dbEnv.ID)

	// Convert back for response
	savedDomain := mapper.EnvironmentDBToDomain(dbEnv)
	response := mapper.EnvironmentDomainToAPI(savedDomain)

	c.JSON(http.StatusCreated, response)
}

// PUT /environments/:id
func (h *EnvironmentHandler) UpdateEnvironment(c *gin.Context) {
	id := c.Param("id")
	var dbEnv db.Environment

	if err := database.DB.First(&dbEnv, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
		return
	}

	var updateReq api.EnvironmentUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status if provided
	if updateReq.Status != "" {
		status := domain.EnvironmentStatus(updateReq.Status)
		if !isValidEnvironmentStatus(status) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment status. Valid values are: active, decommissioned, maintenance, pending"})
			return
		}
	}

	// Validate that Release exists if it's being updated
	if updateReq.ReleaseID != "" && updateReq.ReleaseID != dbEnv.ReleaseID {
		var release db.Release
		if err := database.DB.First(&release, "id = ?", updateReq.ReleaseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Release not found"})
			return
		}
	}

	// Validate that EnvironmentGroup exists if it's being updated
	if updateReq.EnvironmentGroupID != nil && *updateReq.EnvironmentGroupID != "" {
		// Check if EnvironmentGroupID is actually changing
		if dbEnv.EnvironmentGroupID == nil || *updateReq.EnvironmentGroupID != *dbEnv.EnvironmentGroupID {
			var envGroup db.EnvironmentGroup
			if err := database.DB.First(&envGroup, "id = ?", *updateReq.EnvironmentGroupID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Environment Group not found"})
				return
			}
		}
	}

	// Apply updates
	if updateReq.Name != "" {
		dbEnv.Name = updateReq.Name
	}
	if updateReq.ReleaseID != "" {
		dbEnv.ReleaseID = updateReq.ReleaseID
	}
	if updateReq.Status != "" {
		dbEnv.Status = updateReq.Status
	}
	if updateReq.EnvironmentGroupID != nil {
		dbEnv.EnvironmentGroupID = updateReq.EnvironmentGroupID
	}

	if err := database.DB.Save(&dbEnv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment"})
		return
	}

	// Load the updated environment for response
	database.DB.First(&dbEnv, "id = ?", dbEnv.ID)

	// Convert to response
	domainEnv := mapper.EnvironmentDBToDomain(&dbEnv)
	response := mapper.EnvironmentDomainToAPI(domainEnv)

	c.JSON(http.StatusOK, response)
}

// DELETE /environments/:id
func (h *EnvironmentHandler) DeleteEnvironment(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&db.Environment{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete environment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Environment deleted successfully"})
}
