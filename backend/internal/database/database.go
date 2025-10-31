package database

import (
	"fmt"
	"log"

	"release-management/internal/config"
	"release-management/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.Port,
		cfg.Database.SSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto migrate the schema
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Release{},
		&models.System{},
		&models.Build{},
		&models.Environment{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// Migrate system types for existing data
	if err := migrateSystemTypes(); err != nil {
		return fmt.Errorf("failed to migrate system types: %w", err)
	}

	// Seed admin user if it doesn't exist
	if err := seedAdminUser(cfg); err != nil {
		return fmt.Errorf("failed to seed admin user: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

func seedAdminUser(cfg *config.Config) error {
	var count int64
	if err := DB.Model(&models.User{}).Where("is_admin = ?", true).Count(&count).Error; err != nil {
		return err
	}

	// If admin user already exists, skip seeding
	if count > 0 {
		log.Println("Admin user already exists, skipping seeding")
		return nil
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.Admin.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Create admin user
	adminUser := models.User{
		Email:    cfg.Admin.Email,
		Password: string(hashedPassword),
		IsAdmin:  true,
	}

	if err := DB.Create(&adminUser).Error; err != nil {
		return err
	}

	log.Printf("Admin user created successfully: %s", cfg.Admin.Email)
	return nil
}

func migrateSystemTypes() error {
	// Check if the migration has already been completed by checking for NOT NULL constraint
	var result int
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'systems' AND column_name = 'type' AND is_nullable = 'NO'").Scan(&result).Error; err == nil && result > 0 {
		log.Println("System types migration already completed, skipping")
		return nil
	}

	log.Println("Starting system types migration...")

	// Get all systems that need type assignment
	var systems []models.System
	if err := DB.Find(&systems).Error; err != nil {
		return err
	}

	if len(systems) == 0 {
		log.Println("No systems need type migration")
	} else {
		// Process each system that doesn't have a type
		var updatedCount int
		for _, system := range systems {
			// Skip systems that already have a type
			if system.Type != "" {
				continue
			}

			var systemType models.SystemType

			// Check if system has subsystems (parent_systems)
			var subsystemCount int64
			DB.Model(&models.System{}).Where("parent_id = ?", system.ID).Count(&subsystemCount)

			// Check if system has builds
			var buildCount int64
			DB.Model(&models.Build{}).Where("system_id = ?", system.ID).Count(&buildCount)

			if system.ParentID != nil && *system.ParentID != "" {
				// Has parent -> subsystem
				systemType = models.SystemTypeSubsystem
			} else if subsystemCount > 0 {
				// Has subsystems -> parent_systems
				systemType = models.SystemTypeParent
			} else {
				// Independent system -> systems
				systemType = models.SystemTypeSystem
			}

			// Update the system type directly without triggering hooks
			if err := DB.Exec("UPDATE systems SET type = ? WHERE id = ?", systemType, system.ID).Error; err != nil {
				log.Printf("Failed to update system %s type to %s: %v", system.ID, systemType, err)
				return err
			}

			log.Printf("Updated system %s (%s) type to %s", system.ID, system.Name, systemType)
			updatedCount++
		}

		log.Printf("System types migration completed for %d systems", updatedCount)
	}

	// Now add the NOT NULL constraint
	log.Println("Adding NOT NULL constraint to type column...")
	if err := DB.Exec("ALTER TABLE systems ALTER COLUMN type SET NOT NULL").Error; err != nil {
		log.Printf("Failed to add NOT NULL constraint: %v", err)
		return err
	}

	log.Println("System types migration fully completed")
	return nil
}
