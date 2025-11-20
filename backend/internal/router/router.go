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
	environmentGroupsHandler := handlers.NewEnvironmentGroupHandler()

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
			releases.GET("", middleware.RBACMiddleware("read"), releaseHandler.GetReleases)
			releases.GET("/:id", middleware.RBACMiddleware("read"), releaseHandler.GetRelease)
			releases.POST("", middleware.RBACMiddleware("create"), releaseHandler.CreateRelease)
			releases.PUT("/:id", middleware.RBACMiddleware("update"), releaseHandler.UpdateRelease)
			releases.DELETE("/:id", middleware.RBACMiddleware("delete"), releaseHandler.DeleteRelease)
			releases.GET("/:id/builds", middleware.RBACMiddleware("read"), releaseHandler.GetReleaseBuilds)
		}

		// System endpoints
		systems := protected.Group("/systems")
		{
			systems.GET("", middleware.RBACMiddleware("read"), systemHandler.GetSystems)
			systems.GET("/:id", middleware.RBACMiddleware("read"), systemHandler.GetSystem)
			systems.POST("", middleware.RBACMiddleware("create"), systemHandler.CreateSystem)
			systems.PUT("/:id", middleware.RBACMiddleware("update"), systemHandler.UpdateSystem)
			systems.DELETE("/:id", middleware.RBACMiddleware("delete"), systemHandler.DeleteSystem)
			systems.GET("/:id/subsystems", middleware.RBACMiddleware("read"), systemHandler.GetSubsystems)
			systems.GET("/:id/builds", middleware.RBACMiddleware("read"), systemHandler.GetSystemBuilds)
		}

		// Build endpoints
		builds := protected.Group("/builds")
		{
			builds.GET("", middleware.RBACMiddleware("read"), buildHandler.GetBuilds)
			builds.GET("/:id", middleware.RBACMiddleware("read"), buildHandler.GetBuild)
			builds.POST("", middleware.RBACMiddleware("create"), buildHandler.CreateBuild)
			builds.PUT("/:id", middleware.RBACMiddleware("update"), buildHandler.UpdateBuild)
			builds.DELETE("/:id", middleware.RBACMiddleware("delete"), buildHandler.DeleteBuild)
		}

		// Environment endpoints
		environments := protected.Group("/environments")
		{
			environments.GET("", middleware.RBACMiddleware("read"), environmentHandler.GetEnvironments)
			environments.GET("/:id", middleware.RBACMiddleware("read"), environmentHandler.GetEnvironment)
			environments.POST("", middleware.RBACMiddleware("create"), environmentHandler.CreateEnvironment)
			environments.PUT("/:id", middleware.RBACMiddleware("update"), environmentHandler.UpdateEnvironment)
			environments.DELETE("/:id", middleware.RBACMiddleware("delete"), environmentHandler.DeleteEnvironment)

			// Environment-Systems endpoints
			environments.GET("/:id/systems", middleware.RBACMiddleware("read"), handlers.GetEnvironmentSystems)
			environments.GET("/:id/systems/:systemId", middleware.RBACMiddleware("read"), handlers.GetEnvironmentSystem)
			environments.POST("/:id/systems", middleware.RBACMiddleware("create"), handlers.AddSystemToEnvironment)
			environments.PUT("/:id/systems/:systemId", middleware.RBACMiddleware("update"), handlers.UpdateEnvironmentSystem)
			environments.DELETE("/:id/systems/:systemId", middleware.RBACMiddleware("delete"), handlers.RemoveSystemFromEnvironment)
			environments.POST("/:id/systems/sync", middleware.RBACMiddleware("create"), handlers.SyncEnvironmentSystemVersions)
		}

		// Environment Group endpoints
		environmentGroups := protected.Group("/environment-groups")
		{
			environmentGroups.GET("", middleware.RBACMiddleware("read"), environmentGroupsHandler.GetEnvironmentGroups)
			environmentGroups.GET("/:id", middleware.RBACMiddleware("read"), environmentGroupsHandler.GetEnvironmentGroup)
			environmentGroups.POST("", middleware.RBACMiddleware("create"), environmentGroupsHandler.CreateEnvironmentGroup)
			environmentGroups.PUT("/:id", middleware.RBACMiddleware("update"), environmentGroupsHandler.UpdateEnvironmentGroup)
			environmentGroups.DELETE("/:id", middleware.RBACMiddleware("delete"), environmentGroupsHandler.DeleteEnvironmentGroup)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	return r
}
