package mapper

import (
	"release-management/internal/models/api"
	"release-management/internal/models/db"
	"release-management/internal/models/domain"
)

// BuildDBToDomain converts db.Build to domain.Build
func BuildDBToDomain(dbBuild *db.Build) *domain.Build {
	if dbBuild == nil {
		return nil
	}

	domainBuild := &domain.Build{
		ID:        dbBuild.ID,
		SystemID:  dbBuild.SystemID,
		ReleaseID: dbBuild.ReleaseID,
		Version:   dbBuild.Version,
		BuildDate: dbBuild.BuildDate,
		CreatedAt: dbBuild.CreatedAt,
		UpdatedAt: dbBuild.UpdatedAt,
	}

	// Convert relationships
	if dbBuild.System.ID != "" {
		domainBuild.System = SystemDBToDomain(&dbBuild.System)
	}

	if dbBuild.Release != nil {
		domainBuild.Release = ReleaseDBToDomain(dbBuild.Release)
	}

	return domainBuild
}

// BuildDomainToDB converts domain.Build to db.Build
func BuildDomainToDB(domainBuild *domain.Build) *db.Build {
	if domainBuild == nil {
		return nil
	}
	return &db.Build{
		ID:        domainBuild.ID,
		SystemID:  domainBuild.SystemID,
		ReleaseID: domainBuild.ReleaseID,
		Version:   domainBuild.Version,
		BuildDate: domainBuild.BuildDate,
		CreatedAt: domainBuild.CreatedAt,
		UpdatedAt: domainBuild.UpdatedAt,
	}
}

// BuildDomainToAPI converts domain.Build to api.BuildResponse
func BuildDomainToAPI(domainBuild *domain.Build) *api.BuildResponse {
	if domainBuild == nil {
		return nil
	}

	apiBuild := &api.BuildResponse{
		ID:        domainBuild.ID,
		SystemID:  domainBuild.SystemID,
		ReleaseID: domainBuild.ReleaseID,
		Version:   domainBuild.Version,
		BuildDate: domainBuild.BuildDate,
		CreatedAt: domainBuild.CreatedAt,
		UpdatedAt: domainBuild.UpdatedAt,
	}

	// Extract just the system name from the System relationship
	if domainBuild.System != nil {
		apiBuild.SystemName = domainBuild.System.Name
	}

	// Extract just the release name from the Release relationship
	if domainBuild.Release != nil {
		apiBuild.ReleaseName = domainBuild.Release.Name
	}

	return apiBuild
}

// BuildAPIToDomain converts api.BuildRequest to domain.Build
func BuildAPIToDomain(apiReq *api.BuildRequest) *domain.Build {
	if apiReq == nil {
		return nil
	}
	return &domain.Build{
		SystemID:  apiReq.SystemID,
		ReleaseID: apiReq.ReleaseID,
		Version:   apiReq.Version,
		BuildDate: apiReq.BuildDate,
	}
}
