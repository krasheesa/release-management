package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// EnvironmentGroupDBToDomain converts db.EnvironmentGroup to domain.EnvironmentGroup
func EnvironmentGroupDBToDomain(dbGroup *db.EnvironmentGroup) *domain.EnvironmentGroup {
	if dbGroup == nil {
		return nil
	}

	domainGroup := &domain.EnvironmentGroup{
		ID:          dbGroup.ID,
		Name:        dbGroup.Name,
		Description: dbGroup.Description,
		CreatedAt:   dbGroup.CreatedAt,
		UpdatedAt:   dbGroup.UpdatedAt,
	}

	// Convert relationships
	if len(dbGroup.Environments) > 0 {
		domainGroup.Environments = make([]domain.Environment, len(dbGroup.Environments))
		for i, env := range dbGroup.Environments {
			if converted := EnvironmentDBToDomain(&env); converted != nil {
				domainGroup.Environments[i] = *converted
			}
		}
	}

	return domainGroup
}

// EnvironmentGroupDomainToDB converts domain.EnvironmentGroup to db.EnvironmentGroup
func EnvironmentGroupDomainToDB(domainGroup *domain.EnvironmentGroup) *db.EnvironmentGroup {
	if domainGroup == nil {
		return nil
	}
	return &db.EnvironmentGroup{
		ID:          domainGroup.ID,
		Name:        domainGroup.Name,
		Description: domainGroup.Description,
		CreatedAt:   domainGroup.CreatedAt,
		UpdatedAt:   domainGroup.UpdatedAt,
	}
}

// EnvironmentGroupDomainToAPI converts domain.EnvironmentGroup to api.EnvironmentGroupResponse
func EnvironmentGroupDomainToAPI(domainGroup *domain.EnvironmentGroup) *api.EnvironmentGroupResponse {
	if domainGroup == nil {
		return nil
	}

	apiGroup := &api.EnvironmentGroupResponse{
		ID:          domainGroup.ID,
		Name:        domainGroup.Name,
		Description: domainGroup.Description,
		CreatedAt:   domainGroup.CreatedAt,
		UpdatedAt:   domainGroup.UpdatedAt,
	}

	if len(domainGroup.Environments) > 0 {
		apiGroup.Environments = make([]api.SimplifiedEnvironmentInfo, len(domainGroup.Environments))
		for i, env := range domainGroup.Environments {
			apiGroup.Environments[i] = api.SimplifiedEnvironmentInfo{
				ID:        env.ID,
				Name:      env.Name,
				Type:      string(env.Type),
				Status:    string(env.Status),
				ReleaseID: env.ReleaseID,
			}
		}
	}

	return apiGroup
}

// EnvironmentGroupAPIToDomain converts api.EnvironmentGroupRequest to domain.EnvironmentGroup
func EnvironmentGroupAPIToDomain(apiReq *api.EnvironmentGroupRequest) *domain.EnvironmentGroup {
	if apiReq == nil {
		return nil
	}
	return &domain.EnvironmentGroup{
		Name:        apiReq.Name,
		Description: apiReq.Description,
	}
}
