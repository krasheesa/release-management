package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// ReleaseDBToDomain converts db.Release to domain.Release
func ReleaseDBToDomain(dbRel *db.Release) *domain.Release {
	if dbRel == nil {
		return nil
	}

	domainRel := &domain.Release{
		ID:          dbRel.ID,
		Name:        dbRel.Name,
		Description: dbRel.Description,
		ReleaseDate: dbRel.ReleaseDate,
		Status:      domain.ReleaseStatus(dbRel.Status),
		Type:        domain.ReleaseType(dbRel.Type),
		CreatedAt:   dbRel.CreatedAt,
		UpdatedAt:   dbRel.UpdatedAt,
	}

	// Convert relationships
	if len(dbRel.Builds) > 0 {
		domainRel.Builds = make([]domain.Build, len(dbRel.Builds))
		for i, build := range dbRel.Builds {
			if converted := BuildDBToDomain(&build); converted != nil {
				domainRel.Builds[i] = *converted
			}
		}
	}

	return domainRel
}

// ReleaseDomainToDB converts domain.Release to db.Release
func ReleaseDomainToDB(domainRel *domain.Release) *db.Release {
	if domainRel == nil {
		return nil
	}
	return &db.Release{
		ID:          domainRel.ID,
		Name:        domainRel.Name,
		Description: domainRel.Description,
		ReleaseDate: domainRel.ReleaseDate,
		Status:      string(domainRel.Status),
		Type:        string(domainRel.Type),
		CreatedAt:   domainRel.CreatedAt,
		UpdatedAt:   domainRel.UpdatedAt,
	}
}

// ReleaseDomainToAPI converts domain.Release to api.ReleaseResponse
func ReleaseDomainToAPI(domainRel *domain.Release) *api.ReleaseResponse {
	if domainRel == nil {
		return nil
	}

	apiRel := &api.ReleaseResponse{
		ID:          domainRel.ID,
		Name:        domainRel.Name,
		Description: domainRel.Description,
		ReleaseDate: domainRel.ReleaseDate,
		Status:      string(domainRel.Status),
		Type:        string(domainRel.Type),
		CreatedAt:   domainRel.CreatedAt,
		UpdatedAt:   domainRel.UpdatedAt,
	}

	// Convert relationships
	if len(domainRel.Builds) > 0 {
		apiRel.Builds = make([]api.BuildResponse, len(domainRel.Builds))
		for i, build := range domainRel.Builds {
			if converted := BuildDomainToAPI(&build); converted != nil {
				apiRel.Builds[i] = *converted
			}
		}
	}

	return apiRel
}

// ReleaseAPIToDomain converts api.ReleaseRequest to domain.Release
func ReleaseAPIToDomain(apiReq *api.ReleaseRequest) *domain.Release {
	if apiReq == nil {
		return nil
	}
	return &domain.Release{
		Name:        apiReq.Name,
		Description: apiReq.Description,
		ReleaseDate: apiReq.ReleaseDate,
		Status:      domain.ReleaseStatus(apiReq.Status),
		Type:        domain.ReleaseType(apiReq.Type),
	}
}
