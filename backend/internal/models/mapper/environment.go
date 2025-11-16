package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// EnvironmentDBToDomain converts db.Environment to domain.Environment
func EnvironmentDBToDomain(dbEnv *db.Environment) *domain.Environment {
	if dbEnv == nil {
		return nil
	}

	domainEnv := &domain.Environment{
		ID:                 dbEnv.ID,
		Name:               dbEnv.Name,
		Type:               domain.EnvironmentType(dbEnv.Type),
		Status:             domain.EnvironmentStatus(dbEnv.Status),
		URL:                dbEnv.URL,
		Description:        dbEnv.Description,
		ReleaseID:          dbEnv.ReleaseID,
		EnvironmentGroupID: dbEnv.EnvironmentGroupID,
		CreatedAt:          dbEnv.CreatedAt,
		UpdatedAt:          dbEnv.UpdatedAt,
	}

	// Convert relationships
	if len(dbEnv.EnvironmentSystems) > 0 {
		domainEnv.EnvironmentSystems = make([]domain.EnvironmentSystem, len(dbEnv.EnvironmentSystems))
		for i, es := range dbEnv.EnvironmentSystems {
			if converted := EnvironmentSystemDBToDomain(&es); converted != nil {
				domainEnv.EnvironmentSystems[i] = *converted
			}
		}
	}

	return domainEnv
}

// EnvironmentDomainToDB converts domain.Environment to db.Environment
func EnvironmentDomainToDB(domainEnv *domain.Environment) *db.Environment {
	if domainEnv == nil {
		return nil
	}
	return &db.Environment{
		ID:                 domainEnv.ID,
		Name:               domainEnv.Name,
		Type:               string(domainEnv.Type),
		Status:             string(domainEnv.Status),
		URL:                domainEnv.URL,
		Description:        domainEnv.Description,
		ReleaseID:          domainEnv.ReleaseID,
		EnvironmentGroupID: domainEnv.EnvironmentGroupID,
		CreatedAt:          domainEnv.CreatedAt,
		UpdatedAt:          domainEnv.UpdatedAt,
	}
}

// EnvironmentDomainToAPI converts domain.Environment to api.EnvironmentResponse
func EnvironmentDomainToAPI(domainEnv *domain.Environment) *api.EnvironmentResponse {
	if domainEnv == nil {
		return nil
	}

	apiEnv := &api.EnvironmentResponse{
		ID:                 domainEnv.ID,
		Name:               domainEnv.Name,
		Type:               string(domainEnv.Type),
		Status:             string(domainEnv.Status),
		URL:                domainEnv.URL,
		Description:        domainEnv.Description,
		ReleaseID:          domainEnv.ReleaseID,
		EnvironmentGroupID: domainEnv.EnvironmentGroupID,
		CreatedAt:          domainEnv.CreatedAt,
		UpdatedAt:          domainEnv.UpdatedAt,
	}

	// Convert relationships
	if len(domainEnv.EnvironmentSystems) > 0 {
		apiEnv.EnvironmentSystems = make([]api.EnvironmentSystemResponse, len(domainEnv.EnvironmentSystems))
		for i, es := range domainEnv.EnvironmentSystems {
			if converted := EnvironmentSystemDomainToAPI(&es); converted != nil {
				apiEnv.EnvironmentSystems[i] = *converted
			}
		}
	}

	return apiEnv
}

// EnvironmentAPIToDomain converts api.EnvironmentRequest to domain.Environment
func EnvironmentAPIToDomain(apiReq *api.EnvironmentRequest) *domain.Environment {
	if apiReq == nil {
		return nil
	}
	return &domain.Environment{
		Name:               apiReq.Name,
		Type:               domain.EnvironmentType(apiReq.Type),
		Status:             domain.EnvironmentStatus(apiReq.Status),
		URL:                apiReq.URL,
		Description:        apiReq.Description,
		ReleaseID:          apiReq.ReleaseID,
		EnvironmentGroupID: apiReq.EnvironmentGroupID,
	}
}
