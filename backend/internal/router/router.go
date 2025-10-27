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
	releaseHandler := handlers.NewReleaseHandler()
	systemHandler := handlers.NewSystemHandler()
	buildHandler := handlers.NewBuildHandler()
	environmentHandler := handlers.NewEnvironmentHandler()

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

		// Release endpoints
		releases := protected.Group("/releases")
		{
			releases.GET("", releaseHandler.GetReleases)
			releases.GET("/:id", releaseHandler.GetRelease)
			releases.POST("", releaseHandler.CreateRelease)
			releases.PUT("/:id", releaseHandler.UpdateRelease)
			releases.DELETE("/:id", releaseHandler.DeleteRelease)
			releases.GET("/:id/builds", releaseHandler.GetReleaseBuilds)
		}

		// System endpoints
		systems := protected.Group("/systems")
		{
			systems.GET("", systemHandler.GetSystems)
			systems.GET("/:id", systemHandler.GetSystem)
			systems.POST("", systemHandler.CreateSystem)
			systems.PUT("/:id", systemHandler.UpdateSystem)
			systems.DELETE("/:id", systemHandler.DeleteSystem)
			systems.GET("/:id/subsystems", systemHandler.GetSubsystems)
		}

		// Build endpoints
		builds := protected.Group("/builds")
		{
			builds.GET("", buildHandler.GetBuilds)
			builds.GET("/:id", buildHandler.GetBuild)
			builds.POST("", buildHandler.CreateBuild)
			builds.PUT("/:id", buildHandler.UpdateBuild)
			builds.DELETE("/:id", buildHandler.DeleteBuild)
		}

		// Environment endpoints
		environments := protected.Group("/environments")
		{
			environments.GET("", environmentHandler.GetEnvironments)
			environments.GET("/:id", environmentHandler.GetEnvironment)
			environments.POST("", environmentHandler.CreateEnvironment)
			environments.PUT("/:id", environmentHandler.UpdateEnvironment)
			environments.DELETE("/:id", environmentHandler.DeleteEnvironment)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	return r
}
