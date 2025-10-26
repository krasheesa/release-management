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
	if err := DB.AutoMigrate(&models.User{}); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
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
