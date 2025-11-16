package handlers

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/mapper"

	"github.com/gin-gonic/gin"
)

type ReleaseHandler struct{}

func NewReleaseHandler() *ReleaseHandler {
	return &ReleaseHandler{}
}

// GET /releases
func (h *ReleaseHandler) GetReleases(c *gin.Context) {
	var dbReleases []db.Release
	if err := database.DB.Find(&dbReleases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch releases"})
		return
	}

	// Convert to API responses
	apiReleases := make([]api.ReleaseResponse, len(dbReleases))
	for i, dbRel := range dbReleases {
		domainRel := mapper.ReleaseDBToDomain(&dbRel)
		apiRel := mapper.ReleaseDomainToAPI(domainRel)
		apiReleases[i] = *apiRel
	}

	c.JSON(http.StatusOK, apiReleases)
}

// GET /releases/:id
func (h *ReleaseHandler) GetRelease(c *gin.Context) {
	id := c.Param("id")
	var dbRel db.Release

	if err := database.DB.First(&dbRel, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Release not found"})
		return
	}

	domainRel := mapper.ReleaseDBToDomain(&dbRel)
	apiRel := mapper.ReleaseDomainToAPI(domainRel)

	c.JSON(http.StatusOK, apiRel)
}

// POST /releases
func (h *ReleaseHandler) CreateRelease(c *gin.Context) {
	var req api.ReleaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert to domain and then to DB
	domainRel := mapper.ReleaseAPIToDomain(&req)
	dbRel := mapper.ReleaseDomainToDB(domainRel)

	if err := database.DB.Create(&dbRel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create release"})
		return
	}

	// Convert back for response
	savedDomain := mapper.ReleaseDBToDomain(dbRel)
	response := mapper.ReleaseDomainToAPI(savedDomain)

	c.JSON(http.StatusCreated, response)
}

// PUT /releases/:id
func (h *ReleaseHandler) UpdateRelease(c *gin.Context) {
	id := c.Param("id")
	var dbRel db.Release

	if err := database.DB.First(&dbRel, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Release not found"})
		return
	}

	var updateReq api.ReleaseUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Apply updates
	if updateReq.Name != "" {
		dbRel.Name = updateReq.Name
	}
	if !updateReq.ReleaseDate.IsZero() {
		dbRel.ReleaseDate = updateReq.ReleaseDate
	}
	if updateReq.Status != "" {
		dbRel.Status = updateReq.Status
	}
	if updateReq.Type != "" {
		dbRel.Type = updateReq.Type
	}
	if updateReq.Description != nil {
		dbRel.Description = updateReq.Description
	}

	if err := database.DB.Save(&dbRel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update release"})
		return
	}

	// Convert to response
	domainRel := mapper.ReleaseDBToDomain(&dbRel)
	response := mapper.ReleaseDomainToAPI(domainRel)

	c.JSON(http.StatusOK, response)
}

// DELETE /releases/:id
func (h *ReleaseHandler) DeleteRelease(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&db.Release{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete release"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Release deleted successfully"})
}

// GET /releases/:id/builds
func (h *ReleaseHandler) GetReleaseBuilds(c *gin.Context) {
	id := c.Param("id")
	var dbBuilds []db.Build

	if err := database.DB.Where("release_id = ?", id).Preload("System").Find(&dbBuilds).Error; err != nil {
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
