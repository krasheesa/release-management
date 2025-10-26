package router

import (
	"release-management/internal/config"
	"release-management/internal/handlers"
	"release-management/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.GET("/me", authHandler.Me)
		protected.GET("/dashboard", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Welcome to the dashboard! You are authenticated.",
				"userID":  c.GetUint("userID"),
			})
		})
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	return r
}
