package database

import (
	"fmt"
	"log"

	"release-management/internal/config"
	"release-management/internal/models/db"

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
		&db.User{},
		&db.Release{},
		&db.System{},
		&db.Build{},
		&db.EnvironmentGroup{},
		&db.Environment{},
		&db.EnvironmentSystem{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	} // Migrate system types for existing data
	if err := migrateSystemTypes(); err != nil {
		return fmt.Errorf("failed to migrate system types: %w", err)
	}

	// Migrate environment status for existing data
	if err := migrateEnvironmentStatus(); err != nil {
		return fmt.Errorf("failed to migrate environment status: %w", err)
	}

	// Migrate environment groups for existing data
	if err := migrateEnvironmentGroups(); err != nil {
		return fmt.Errorf("failed to migrate environment groups: %w", err)
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
	if err := DB.Model(&db.User{}).Where("is_admin = ?", true).Count(&count).Error; err != nil {
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
	adminUser := db.User{
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
	var systems []db.System
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

			var systemType string

			// Check if system has subsystems (parent_systems)
			var subsystemCount int64
			DB.Model(&db.System{}).Where("parent_id = ?", system.ID).Count(&subsystemCount)

			// Check if system has builds
			var buildCount int64
			DB.Model(&db.Build{}).Where("system_id = ?", system.ID).Count(&buildCount)

			if system.ParentID != nil && *system.ParentID != "" {
				// Has parent -> subsystem
				systemType = "subsystems"
			} else if subsystemCount > 0 {
				// Has subsystems -> parent_systems
				systemType = "parent_systems"
			} else {
				// Independent system -> systems
				systemType = "systems"
			} // Update the system type directly without triggering hooks
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

func migrateSystemStatus() error {
	// Check if the migration has already been completed by checking for NOT NULL constraint
	var result int
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'systems' AND column_name = 'status' AND is_nullable = 'NO'").Scan(&result).Error; err == nil && result > 0 {
		log.Println("System status migration already completed, skipping")
		return nil
	}

	log.Println("Starting system status migration...")

	// Update all existing systems that have null status to 'active'
	var updatedCount int64
	if err := DB.Exec("UPDATE systems SET status = ? WHERE status IS NULL OR status = ''", "active").Error; err != nil {
		log.Printf("Failed to update systems status: %v", err)
		return err
	}

	// Get the number of updated records
	DB.Model(&db.System{}).Where("status = ?", "active").Count(&updatedCount)

	log.Printf("Systems status migration completed for %d system", updatedCount)

	// Now add the NOT NULL constraint
	log.Println("Adding NOT NULL constraint to status column...")
	if err := DB.Exec("ALTER TABLE systems ALTER COLUMN status SET NOT NULL").Error; err != nil {
		log.Printf("Failed to add NOT NULL constraint: %v", err)
		return err
	}

	log.Println("Systems status migration fully completed")
	return nil

}

func migrateEnvironmentStatus() error {
	// Check if the migration has already been completed by checking for NOT NULL constraint
	var result int
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'environments' AND column_name = 'status' AND is_nullable = 'NO'").Scan(&result).Error; err == nil && result > 0 {
		log.Println("Environment status migration already completed, skipping")
		return nil
	}

	log.Println("Starting environment status migration...")

	// Update all existing environments that have null status to 'active'
	var updatedCount int64
	if err := DB.Exec("UPDATE environments SET status = ? WHERE status IS NULL OR status = ''", "active").Error; err != nil {
		log.Printf("Failed to update environment status: %v", err)
		return err
	}

	// Get the number of updated records
	DB.Model(&db.Environment{}).Where("status = ?", "active").Count(&updatedCount)

	log.Printf("Environment status migration completed for %d environments", updatedCount)

	// Now add the NOT NULL constraint
	log.Println("Adding NOT NULL constraint to status column...")
	if err := DB.Exec("ALTER TABLE environments ALTER COLUMN status SET NOT NULL").Error; err != nil {
		log.Printf("Failed to add NOT NULL constraint: %v", err)
		return err
	}

	log.Println("Environment status migration fully completed")
	return nil
}

func migrateEnvironmentGroups() error {
	log.Println("Starting environment groups migration...")

	// Create a default environment group if none exists
	var groupCount int64
	DB.Model(&db.EnvironmentGroup{}).Count(&groupCount)

	var defaultGroupID string
	if groupCount == 0 {
		log.Println("Creating default environment group...")
		defaultGroup := db.EnvironmentGroup{
			Name:        "Default Environment Group",
			Description: &[]string{"Default group for existing environments"}[0],
		}

		if err := DB.Create(&defaultGroup).Error; err != nil {
			log.Printf("Failed to create default environment group: %v", err)
			return err
		}

		defaultGroupID = defaultGroup.ID
		log.Printf("Created default environment group with ID: %s", defaultGroupID)
	} else {
		// Get the first available environment group
		var firstGroup db.EnvironmentGroup
		if err := DB.First(&firstGroup).Error; err != nil {
			log.Printf("Failed to get existing environment group: %v", err)
			return err
		}
		defaultGroupID = firstGroup.ID
		log.Printf("Using existing environment group: %s", defaultGroupID)
	}

	// Update all environments that don't have an environment group assigned
	var updatedCount int64
	if err := DB.Exec("UPDATE environments SET environment_group_id = ? WHERE environment_group_id IS NULL", defaultGroupID).Error; err != nil {
		log.Printf("Failed to update environment group assignments: %v", err)
		return err
	}

	// Get the number of updated records
	DB.Model(&db.Environment{}).Where("environment_group_id = ?", defaultGroupID).Count(&updatedCount)

	log.Printf("Environment groups migration completed for %d environments", updatedCount)
	log.Println("Environment groups migration fully completed")
	return nil
}
