package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// SystemDBToDomain converts db.System to domain.System
func SystemDBToDomain(dbSys *db.System) *domain.System {
	if dbSys == nil {
		return nil
	}

	domainSys := &domain.System{
		ID:          dbSys.ID,
		Name:        dbSys.Name,
		Description: dbSys.Description,
		ParentID:    dbSys.ParentID,
		Type:        domain.SystemType(dbSys.Type),
		Status:      domain.SystemStatus(dbSys.Status),
		CreatedAt:   dbSys.CreatedAt,
		UpdatedAt:   dbSys.UpdatedAt,
	}

	// Convert relationships
	if dbSys.Parent != nil {
		domainSys.Parent = SystemDBToDomain(dbSys.Parent)
	}

	if len(dbSys.Subsystems) > 0 {
		domainSys.Subsystems = make([]domain.System, len(dbSys.Subsystems))
		for i, sub := range dbSys.Subsystems {
			if converted := SystemDBToDomain(&sub); converted != nil {
				domainSys.Subsystems[i] = *converted
			}
		}
	}

	if len(dbSys.Builds) > 0 {
		domainSys.Builds = make([]domain.Build, len(dbSys.Builds))
		for i, build := range dbSys.Builds {
			if converted := BuildDBToDomain(&build); converted != nil {
				domainSys.Builds[i] = *converted
			}
		}
	}

	return domainSys
}

// SystemDomainToDB converts domain.System to db.System
func SystemDomainToDB(domainSys *domain.System) *db.System {
	if domainSys == nil {
		return nil
	}
	return &db.System{
		ID:          domainSys.ID,
		Name:        domainSys.Name,
		Description: domainSys.Description,
		ParentID:    domainSys.ParentID,
		Type:        string(domainSys.Type),
		Status:      string(domainSys.Status),
		CreatedAt:   domainSys.CreatedAt,
		UpdatedAt:   domainSys.UpdatedAt,
	}
}

// SystemDomainToAPI converts domain.System to api.SystemResponse
func SystemDomainToAPI(domainSys *domain.System) *api.SystemResponse {
	if domainSys == nil {
		return nil
	}

	apiSys := &api.SystemResponse{
		ID:          domainSys.ID,
		Name:        domainSys.Name,
		Description: domainSys.Description,
		ParentID:    domainSys.ParentID,
		Type:        string(domainSys.Type),
		Status:      string(domainSys.Status),
		CreatedAt:   domainSys.CreatedAt,
		UpdatedAt:   domainSys.UpdatedAt,
	}

	// Convert relationships
	if domainSys.Parent != nil {
		apiSys.Parent = SystemDomainToAPI(domainSys.Parent)
	}

	if len(domainSys.Subsystems) > 0 {
		apiSys.Subsystems = make([]api.SystemResponse, len(domainSys.Subsystems))
		for i, sub := range domainSys.Subsystems {
			if converted := SystemDomainToAPI(&sub); converted != nil {
				apiSys.Subsystems[i] = *converted
			}
		}
	}

	if len(domainSys.Builds) > 0 {
		apiSys.Builds = make([]api.BuildResponse, len(domainSys.Builds))
		for i, build := range domainSys.Builds {
			if converted := BuildDomainToAPI(&build); converted != nil {
				apiSys.Builds[i] = *converted
			}
		}
	}

	return apiSys
}

// SystemAPIToDomain converts api.SystemRequest to domain.System
func SystemAPIToDomain(apiReq *api.SystemRequest) *domain.System {
	if apiReq == nil {
		return nil
	}
	return &domain.System{
		Name:        apiReq.Name,
		Description: apiReq.Description,
		ParentID:    apiReq.ParentID,
		Type:        domain.SystemType(apiReq.Type),
		Status:      domain.SystemStatus(apiReq.Status),
	}
}
