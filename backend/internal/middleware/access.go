package middleware

import (
	"net/http"
	"strings"

	"release-management/internal/database"
	"release-management/internal/models/db"

	"github.com/gin-gonic/gin"
)

func matchPermission(pattern, requested string) bool {
	if pattern == "*" {
		return true
	}

	if pattern == requested {
		return true
	}

	patternParts := strings.Split(pattern, ":")
	requestedParts := strings.Split(requested, ":")

	if len(patternParts) != 2 || len(requestedParts) != 2 {
		return pattern == requested
	}

	patternResource := patternParts[0]
	patternAction := patternParts[1]
	requestedResource := requestedParts[0]
	requestedAction := requestedParts[1]

	resourceMatch := patternResource == "*" || patternResource == requestedResource

	actionMatch := patternAction == "*" || patternAction == requestedAction

	return resourceMatch && actionMatch
}

func HasAccess(userID int, requestedPermission string) bool {
	var permissions []db.Access
	err := database.DB.Table("access").
		Select("access.*").
		Joins("JOIN role_access ON access.id = role_access.access_id").
		Joins("JOIN roles ON role_access.role_id = roles.id").
		Joins("JOIN user_role ON roles.id = user_role.role_id").
		Where("user_role.user_id = ?", userID).
		Find(&permissions).Error

	if err != nil {
		return false
	}

	for _, perm := range permissions {
		if matchPermission(perm.AccessName, requestedPermission) {
			return true
		}
	}

	return false
}

func RBACMiddleware(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
			c.Abort()
			return
		}

		var user db.User
		if err := database.DB.First(&user, userID).Error; err == nil && user.IsAdmin {
			c.Next()
			return
		}

		if !HasAccess(int(userID.(uint)), permission) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}
