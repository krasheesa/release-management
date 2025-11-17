package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// UserDBToDomain converts db.User to domain.User
func UserDBToDomain(dbUser *db.User) *domain.User {
	if dbUser == nil {
		return nil
	}
	return &domain.User{
		ID:        dbUser.ID,
		Email:     dbUser.Email,
		Password:  dbUser.Password,
		IsAdmin:   dbUser.IsAdmin,
		CreatedAt: dbUser.CreatedAt,
		UpdatedAt: dbUser.UpdatedAt,
	}
}

// UserDomainToDB converts domain.User to db.User
func UserDomainToDB(domainUser *domain.User) *db.User {
	if domainUser == nil {
		return nil
	}
	return &db.User{
		ID:        domainUser.ID,
		Email:     domainUser.Email,
		Password:  domainUser.Password,
		IsAdmin:   domainUser.IsAdmin,
		CreatedAt: domainUser.CreatedAt,
		UpdatedAt: domainUser.UpdatedAt,
	}
}

// UserDomainToAPI converts domain.User to api.UserResponse
func UserDomainToAPI(domainUser *domain.User) *api.UserResponse {
	if domainUser == nil {
		return nil
	}
	return &api.UserResponse{
		ID:        domainUser.ID,
		Email:     domainUser.Email,
		IsAdmin:   domainUser.IsAdmin,
		CreatedAt: domainUser.CreatedAt,
		UpdatedAt: domainUser.UpdatedAt,
	}
}
