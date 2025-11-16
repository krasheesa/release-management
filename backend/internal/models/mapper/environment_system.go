package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// EnvironmentSystemDBToDomain converts db.EnvironmentSystem to domain.EnvironmentSystem
func EnvironmentSystemDBToDomain(dbES *db.EnvironmentSystem) *domain.EnvironmentSystem {
	if dbES == nil {
		return nil
	}

	domainES := &domain.EnvironmentSystem{
		ID:            dbES.ID,
		EnvironmentID: dbES.EnvironmentID,
		SystemID:      dbES.SystemID,
		Version:       dbES.Version,
		Status:        dbES.Status,
		CreatedAt:     dbES.CreatedAt,
		UpdatedAt:     dbES.UpdatedAt,
	}

	// Convert relationships
	if dbES.Environment.ID != "" {
		domainES.Environment = EnvironmentDBToDomain(&dbES.Environment)
	}

	if dbES.System.ID != "" {
		domainES.System = SystemDBToDomain(&dbES.System)
	}

	return domainES
}

// EnvironmentSystemDomainToDB converts domain.EnvironmentSystem to db.EnvironmentSystem
func EnvironmentSystemDomainToDB(domainES *domain.EnvironmentSystem) *db.EnvironmentSystem {
	if domainES == nil {
		return nil
	}
	return &db.EnvironmentSystem{
		ID:            domainES.ID,
		EnvironmentID: domainES.EnvironmentID,
		SystemID:      domainES.SystemID,
		Version:       domainES.Version,
		Status:        domainES.Status,
		CreatedAt:     domainES.CreatedAt,
		UpdatedAt:     domainES.UpdatedAt,
	}
}

// EnvironmentSystemDomainToAPI converts domain.EnvironmentSystem to api.EnvironmentSystemResponse
func EnvironmentSystemDomainToAPI(domainES *domain.EnvironmentSystem) *api.EnvironmentSystemResponse {
	if domainES == nil {
		return nil
	}

	apiES := &api.EnvironmentSystemResponse{
		ID:            domainES.ID,
		EnvironmentID: domainES.EnvironmentID,
		SystemID:      domainES.SystemID,
		Version:       domainES.Version,
		Status:        domainES.Status,
		CreatedAt:     domainES.CreatedAt,
		UpdatedAt:     domainES.UpdatedAt,
	}

	// Convert relationships
	if domainES.System != nil {
		apiES.System = SystemDomainToAPI(domainES.System)
	}

	if domainES.Environment != nil {
		apiES.Environment = EnvironmentDomainToAPI(domainES.Environment)
	}

	return apiES
}

// EnvironmentSystemAPIToDomain converts api.EnvironmentSystemRequest to domain.EnvironmentSystem
func EnvironmentSystemAPIToDomain(apiReq *api.EnvironmentSystemRequest) *domain.EnvironmentSystem {
	if apiReq == nil {
		return nil
	}
	return &domain.EnvironmentSystem{
		SystemID: apiReq.SystemID,
		Version:  apiReq.Version,
		Status:   apiReq.Status,
	}
}
