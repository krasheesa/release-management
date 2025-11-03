package handlers

import (
	"fmt"
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GetEnvironmentSystems gets all systems for an environment
func GetEnvironmentSystems(c *gin.Context) {
	envID := c.Param("id")

	// Check if environment exists
	var environment models.Environment
	if err := database.DB.First(&environment, "id = ?", envID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment"})
		return
	}

	var envSystems []models.EnvironmentSystem
	if err := database.DB.Preload("System").
		Where("environment_id = ?", envID).
		Find(&envSystems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment systems"})
		return
	}

	// Create simplified response
	var systems []models.SimpleSystemInfo
	for _, envSystem := range envSystems {
		systems = append(systems, models.SimpleSystemInfo{
			SystemID:   envSystem.SystemID,
			SystemName: envSystem.System.Name,
			Status:     envSystem.Status,
			Version:    envSystem.Version,
		})
	}

	response := models.EnvironmentSystemsResponse{
		EnvironmentID:   environment.ID,
		EnvironmentName: environment.Name,
		Systems:         systems,
	}

	c.JSON(http.StatusOK, response)
}

// GetEnvironmentSystem gets a specific system in an environment
func GetEnvironmentSystem(c *gin.Context) {
	envID := c.Param("id")
	systemID := c.Param("systemId")

	var envSystem models.EnvironmentSystem
	if err := database.DB.Preload("System").
		Where("environment_id = ? AND system_id = ?", envID, systemID).
		First(&envSystem).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment system not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment system"})
		return
	}

	// Get available versions for this system
	availableVersions, err := getAvailableVersionsForSystem(systemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch available versions"})
		return
	}

	response := models.SimpleSystemInfo{
		SystemID:   envSystem.SystemID,
		SystemName: envSystem.System.Name,
		Status:     envSystem.Status,
		Version:    envSystem.Version,
	}

	c.JSON(http.StatusOK, gin.H{
		"system":             response,
		"available_versions": availableVersions,
	})
}

// AddSystemToEnvironment adds a system to an environment
func AddSystemToEnvironment(c *gin.Context) {
	envID := c.Param("id")

	var req models.EnvironmentSystemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if environment exists
	var environment models.Environment
	if err := database.DB.First(&environment, "id = ?", envID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment"})
		return
	}

	// Get the release and its builds separately
	var release models.Release
	var builds []models.Build
	if err := database.DB.First(&release, "id = ?", environment.ReleaseID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment's release"})
		return
	}
	if err := database.DB.Where("release_id = ?", release.ID).Find(&builds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch release builds"})
		return
	}

	// Check if system exists
	var system models.System
	if err := database.DB.Preload("Subsystems").First(&system, "id = ?", req.SystemID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "System not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch system"})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var systemsToAdd []models.System

	// If it's a parent system, add all its subsystems
	if system.Type == models.SystemTypeParent {
		systemsToAdd = append(systemsToAdd, system.Subsystems...)
	} else {
		systemsToAdd = append(systemsToAdd, system)
	}

	var addedSystems []models.EnvironmentSystem

	for _, sys := range systemsToAdd {
		// Check if system is already in environment
		var existingEnvSystem models.EnvironmentSystem
		if err := tx.Where("environment_id = ? AND system_id = ?", envID, sys.ID).
			First(&existingEnvSystem).Error; err == nil {
			// System already exists, skip
			continue
		}

		// Determine version from release builds
		version := req.Version
		if version == "" {
			version = getSystemVersionFromRelease(builds, sys.ID)
		} else {
			// Validate version against available builds
			isValid, err := isValidVersionForSystem(sys.ID, version)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate version"})
				return
			}
			if !isValid {
				tx.Rollback()
				availableVersions, _ := getAvailableVersionsForSystem(sys.ID)
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Version %s not found for system %s. Available versions: %v", version, sys.Name, availableVersions),
				})
				return
			}
		}

		// Create environment system entry
		envSystem := models.EnvironmentSystem{
			ID:            uuid.New().String(),
			EnvironmentID: envID,
			SystemID:      sys.ID,
			Version:       version,
			Status:        "active",
		}

		if req.Status != "" {
			envSystem.Status = req.Status
		}

		if err := tx.Create(&envSystem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add system to environment"})
			return
		}

		addedSystems = append(addedSystems, envSystem)
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Reload with relationships for simplified response
	var systems []models.SimpleSystemInfo
	for _, envSystem := range addedSystems {
		var reloaded models.EnvironmentSystem
		if err := database.DB.Preload("System").Where("environment_id = ? AND system_id = ?", envSystem.EnvironmentID, envSystem.SystemID).First(&reloaded).Error; err != nil {
			// Fallback: create response from what we have
			var system models.System
			database.DB.First(&system, envSystem.SystemID)
			systems = append(systems, models.SimpleSystemInfo{
				SystemID:   envSystem.SystemID,
				SystemName: system.Name,
				Status:     envSystem.Status,
				Version:    envSystem.Version,
			})
		} else {
			systems = append(systems, models.SimpleSystemInfo{
				SystemID:   reloaded.SystemID,
				SystemName: reloaded.System.Name,
				Status:     reloaded.Status,
				Version:    reloaded.Version,
			})
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Added %d system(s) to environment", len(addedSystems)),
		"systems": systems,
	})
}

// UpdateEnvironmentSystem updates a system in an environment
func UpdateEnvironmentSystem(c *gin.Context) {
	envID := c.Param("id")
	systemID := c.Param("systemId")

	var req models.EnvironmentSystemUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var envSystem models.EnvironmentSystem
	if err := database.DB.Where("environment_id = ? AND system_id = ?", envID, systemID).
		First(&envSystem).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment system not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment system"})
		return
	}

	// Update fields
	if req.Version != "" {
		// Validate version against available builds
		isValid, err := isValidVersionForSystem(systemID, req.Version)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate version"})
			return
		}
		if !isValid {
			availableVersions, _ := getAvailableVersionsForSystem(systemID)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Version %s not found for system. Available versions: %v", req.Version, availableVersions),
			})
			return
		}
		envSystem.Version = req.Version
	}
	if req.Status != "" {
		if req.Status != "active" && req.Status != "inactive" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'active' or 'inactive'"})
			return
		}
		envSystem.Status = req.Status
	}

	if err := database.DB.Save(&envSystem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update environment system"})
		return
	}

	// Reload with relationships
	database.DB.Preload("System").First(&envSystem, envSystem.ID)

	response := models.SimpleSystemInfo{
		SystemID:   envSystem.SystemID,
		SystemName: envSystem.System.Name,
		Status:     envSystem.Status,
		Version:    envSystem.Version,
	}

	c.JSON(http.StatusOK, response)
}

// RemoveSystemFromEnvironment removes a system from an environment
func RemoveSystemFromEnvironment(c *gin.Context) {
	envID := c.Param("id")
	systemID := c.Param("systemId")

	var envSystem models.EnvironmentSystem
	if err := database.DB.Where("environment_id = ? AND system_id = ?", envID, systemID).
		First(&envSystem).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment system not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment system"})
		return
	}

	if err := database.DB.Delete(&envSystem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove system from environment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "System removed from environment successfully"})
}

// SyncEnvironmentSystemVersions syncs system versions with the environment's release
func SyncEnvironmentSystemVersions(c *gin.Context) {
	envID := c.Param("id")

	// Check if environment exists
	var environment models.Environment
	if err := database.DB.First(&environment, "id = ?", envID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment"})
		return
	}

	// Get the release and its builds separately
	var release models.Release
	var builds []models.Build
	if err := database.DB.First(&release, "id = ?", environment.ReleaseID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment's release"})
		return
	}
	if err := database.DB.Where("release_id = ?", release.ID).Find(&builds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch release builds"})
		return
	}

	// Get all environment systems
	var envSystems []models.EnvironmentSystem
	if err := database.DB.Where("environment_id = ?", envID).Find(&envSystems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment systems"})
		return
	}

	// Update versions
	var updated []models.EnvironmentSystem
	for _, envSystem := range envSystems {
		newVersion := getSystemVersionFromRelease(builds, envSystem.SystemID)
		if newVersion != envSystem.Version {
			envSystem.Version = newVersion
			if err := database.DB.Save(&envSystem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update system version"})
				return
			}
			updated = append(updated, envSystem)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Updated %d system version(s)", len(updated)),
		"updated_count": len(updated),
	})
}

// Helper function to get system version from release builds
func getSystemVersionFromRelease(builds []models.Build, systemID string) string {
	for _, build := range builds {
		if build.SystemID == systemID {
			return build.Version
		}
	}
	return "" // Empty if no build found for this system
}

// Helper function to get all available versions for a system
func getAvailableVersionsForSystem(systemID string) ([]string, error) {
	var builds []models.Build
	if err := database.DB.Where("system_id = ?", systemID).Find(&builds).Error; err != nil {
		return nil, err
	}

	var versions []string
	for _, build := range builds {
		versions = append(versions, build.Version)
	}
	return versions, nil
}

// Helper function to validate version against available builds
func isValidVersionForSystem(systemID, version string) (bool, error) {
	if version == "" {
		return true, nil // Empty version is allowed
	}

	availableVersions, err := getAvailableVersionsForSystem(systemID)
	if err != nil {
		return false, err
	}

	for _, availableVersion := range availableVersions {
		if availableVersion == version {
			return true, nil
		}
	}
	return false, nil
}
