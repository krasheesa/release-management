package middleware

import (
	"net/http"

	"release-management/internal/database"
	"release-management/internal/models/db"

	"github.com/gin-gonic/gin"
)

func HasAccess(userID int, accessName string) bool {
	var count int64
	err := database.DB.Table("user_role").Select("COUNT(*)").
		Joins("JOIN roles ON user_role.role_id = roles.id").
		Joins("JOIN role_access ON roles.id = role_access.role_id").
		Joins("JOIN access ON role_access.access_id = access.id").
		Where("user_role.user_id = ? AND access.access_name = ?", userID, accessName).
		Count(&count).Error
	if err != nil {
		return false
	}
	return count > 0
}

func RBACMiddleware(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
			c.Abort()
			return
		}

		// Check if user is admin - admins bypass RBAC checks
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
