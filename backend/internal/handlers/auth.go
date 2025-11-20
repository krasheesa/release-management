package handlers

import (
	"net/http"
	"strconv"
	"time"

	"release-management/internal/config"
	"release-management/internal/database"
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/mapper"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req api.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var dbUser db.User
	if err := database.DB.Where("email = ?", req.Email).First(&dbUser).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := h.generateJWT(dbUser.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	domainUser := mapper.UserDBToDomain(&dbUser)
	userResponse := mapper.UserDomainToAPI(domainUser)

	c.JSON(http.StatusOK, api.AuthResponse{
		Token: token,
		User:  *userResponse,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req api.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser db.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	dbUser := db.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		IsAdmin:  false,
	}

	if err := database.DB.Create(&dbUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Assign default role to the user
	var defaultRole db.Roles
	if err := database.DB.Where("role_name = ?", "viewer").First(&defaultRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role"})
		return
	}

	userRole := db.UserRole{
		UserID: dbUser.ID,
		RoleID: defaultRole.ID,
	}

	if err := database.DB.Create(&userRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role"})
		return
	}

	token, err := h.generateJWT(dbUser.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	domainUser := mapper.UserDBToDomain(&dbUser)
	userResponse := mapper.UserDomainToAPI(domainUser)

	c.JSON(http.StatusCreated, api.AuthResponse{
		Token: token,
		User:  *userResponse,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var dbUser db.User
	if err := database.DB.First(&dbUser, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	domainUser := mapper.UserDBToDomain(&dbUser)
	userResponse := mapper.UserDomainToAPI(domainUser)

	c.JSON(http.StatusOK, userResponse)
}

func (h *AuthHandler) generateJWT(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": strconv.Itoa(int(userID)),
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWT.Secret))
}
