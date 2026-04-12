import { apiRequest } from './client';
import { buildQueryString } from './query-string';

import type {
  BlockListQueryParams,
  BlockRecord,
  CostCenterListQueryParams,
  CostCenterRecord,
  CreateBlockPayload,
  CreateCostCenterPayload,
  CreateProjectPayload,
  CreateProjectPhasePayload,
  CreateUnitPayload,
  CreateUnitTypePayload,
  CreateZonePayload,
  PaginatedResponse,
  ProjectListQueryParams,
  ProjectPhaseListQueryParams,
  ProjectPhaseRecord,
  ProjectRecord,
  UnitListQueryParams,
  UnitRecord,
  UnitStatusListQueryParams,
  UnitStatusRecord,
  UnitTypeListQueryParams,
  UnitTypeRecord,
  UpdateBlockPayload,
  UpdateCostCenterPayload,
  UpdateProjectPayload,
  UpdateProjectPhasePayload,
  UpdateUnitPayload,
  UpdateUnitTypePayload,
  UpdateZonePayload,
  ZoneListQueryParams,
  ZoneRecord,
} from './types';

export const listProjects = (
  companyId: string,
  query: ProjectListQueryParams,
) =>
  apiRequest<PaginatedResponse<ProjectRecord>>(
    `companies/${companyId}/projects${buildQueryString(query)}`,
  );

export const getProject = (companyId: string, projectId: string) =>
  apiRequest<ProjectRecord>(`companies/${companyId}/projects/${projectId}`);

export const createProject = (
  companyId: string,
  payload: CreateProjectPayload,
) =>
  apiRequest<ProjectRecord>(`companies/${companyId}/projects`, {
    method: 'POST',
    body: payload,
  });

export const updateProject = (
  companyId: string,
  projectId: string,
  payload: UpdateProjectPayload,
) =>
  apiRequest<ProjectRecord>(`companies/${companyId}/projects/${projectId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateProject = (companyId: string, projectId: string) =>
  apiRequest<ProjectRecord>(`companies/${companyId}/projects/${projectId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateProject = (companyId: string, projectId: string) =>
  apiRequest<ProjectRecord>(
    `companies/${companyId}/projects/${projectId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listCostCenters = (
  companyId: string,
  query: CostCenterListQueryParams,
) =>
  apiRequest<PaginatedResponse<CostCenterRecord>>(
    `companies/${companyId}/cost-centers${buildQueryString(query)}`,
  );

export const getCostCenter = (companyId: string, costCenterId: string) =>
  apiRequest<CostCenterRecord>(
    `companies/${companyId}/cost-centers/${costCenterId}`,
  );

export const createCostCenter = (
  companyId: string,
  payload: CreateCostCenterPayload,
) =>
  apiRequest<CostCenterRecord>(`companies/${companyId}/cost-centers`, {
    method: 'POST',
    body: payload,
  });

export const updateCostCenter = (
  companyId: string,
  costCenterId: string,
  payload: UpdateCostCenterPayload,
) =>
  apiRequest<CostCenterRecord>(
    `companies/${companyId}/cost-centers/${costCenterId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateCostCenter = (companyId: string, costCenterId: string) =>
  apiRequest<CostCenterRecord>(
    `companies/${companyId}/cost-centers/${costCenterId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateCostCenter = (companyId: string, costCenterId: string) =>
  apiRequest<CostCenterRecord>(
    `companies/${companyId}/cost-centers/${costCenterId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listProjectPhases = (
  companyId: string,
  query: ProjectPhaseListQueryParams,
) =>
  apiRequest<PaginatedResponse<ProjectPhaseRecord>>(
    `companies/${companyId}/project-phases${buildQueryString(query)}`,
  );

export const getProjectPhase = (companyId: string, projectPhaseId: string) =>
  apiRequest<ProjectPhaseRecord>(
    `companies/${companyId}/project-phases/${projectPhaseId}`,
  );

export const createProjectPhase = (
  companyId: string,
  payload: CreateProjectPhasePayload,
) =>
  apiRequest<ProjectPhaseRecord>(`companies/${companyId}/project-phases`, {
    method: 'POST',
    body: payload,
  });

export const updateProjectPhase = (
  companyId: string,
  projectPhaseId: string,
  payload: UpdateProjectPhasePayload,
) =>
  apiRequest<ProjectPhaseRecord>(
    `companies/${companyId}/project-phases/${projectPhaseId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateProjectPhase = (
  companyId: string,
  projectPhaseId: string,
) =>
  apiRequest<ProjectPhaseRecord>(
    `companies/${companyId}/project-phases/${projectPhaseId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateProjectPhase = (
  companyId: string,
  projectPhaseId: string,
) =>
  apiRequest<ProjectPhaseRecord>(
    `companies/${companyId}/project-phases/${projectPhaseId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listBlocks = (companyId: string, query: BlockListQueryParams) =>
  apiRequest<PaginatedResponse<BlockRecord>>(
    `companies/${companyId}/blocks${buildQueryString(query)}`,
  );

export const getBlock = (companyId: string, blockId: string) =>
  apiRequest<BlockRecord>(`companies/${companyId}/blocks/${blockId}`);

export const createBlock = (companyId: string, payload: CreateBlockPayload) =>
  apiRequest<BlockRecord>(`companies/${companyId}/blocks`, {
    method: 'POST',
    body: payload,
  });

export const updateBlock = (
  companyId: string,
  blockId: string,
  payload: UpdateBlockPayload,
) =>
  apiRequest<BlockRecord>(`companies/${companyId}/blocks/${blockId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateBlock = (companyId: string, blockId: string) =>
  apiRequest<BlockRecord>(`companies/${companyId}/blocks/${blockId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateBlock = (companyId: string, blockId: string) =>
  apiRequest<BlockRecord>(
    `companies/${companyId}/blocks/${blockId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listZones = (companyId: string, query: ZoneListQueryParams) =>
  apiRequest<PaginatedResponse<ZoneRecord>>(
    `companies/${companyId}/zones${buildQueryString(query)}`,
  );

export const getZone = (companyId: string, zoneId: string) =>
  apiRequest<ZoneRecord>(`companies/${companyId}/zones/${zoneId}`);

export const createZone = (companyId: string, payload: CreateZonePayload) =>
  apiRequest<ZoneRecord>(`companies/${companyId}/zones`, {
    method: 'POST',
    body: payload,
  });

export const updateZone = (
  companyId: string,
  zoneId: string,
  payload: UpdateZonePayload,
) =>
  apiRequest<ZoneRecord>(`companies/${companyId}/zones/${zoneId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateZone = (companyId: string, zoneId: string) =>
  apiRequest<ZoneRecord>(`companies/${companyId}/zones/${zoneId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateZone = (companyId: string, zoneId: string) =>
  apiRequest<ZoneRecord>(`companies/${companyId}/zones/${zoneId}/deactivate`, {
    method: 'POST',
    body: {},
  });

export const listUnitTypes = (
  companyId: string,
  query: UnitTypeListQueryParams,
) =>
  apiRequest<PaginatedResponse<UnitTypeRecord>>(
    `companies/${companyId}/unit-types${buildQueryString(query)}`,
  );

export const getUnitType = (companyId: string, unitTypeId: string) =>
  apiRequest<UnitTypeRecord>(`companies/${companyId}/unit-types/${unitTypeId}`);

export const createUnitType = (
  companyId: string,
  payload: CreateUnitTypePayload,
) =>
  apiRequest<UnitTypeRecord>(`companies/${companyId}/unit-types`, {
    method: 'POST',
    body: payload,
  });

export const updateUnitType = (
  companyId: string,
  unitTypeId: string,
  payload: UpdateUnitTypePayload,
) =>
  apiRequest<UnitTypeRecord>(`companies/${companyId}/unit-types/${unitTypeId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateUnitType = (companyId: string, unitTypeId: string) =>
  apiRequest<UnitTypeRecord>(
    `companies/${companyId}/unit-types/${unitTypeId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateUnitType = (companyId: string, unitTypeId: string) =>
  apiRequest<UnitTypeRecord>(
    `companies/${companyId}/unit-types/${unitTypeId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listUnitStatuses = (
  companyId: string,
  query: UnitStatusListQueryParams,
) =>
  apiRequest<PaginatedResponse<UnitStatusRecord>>(
    `companies/${companyId}/unit-statuses${buildQueryString(query)}`,
  );

export const listUnits = (companyId: string, query: UnitListQueryParams) =>
  apiRequest<PaginatedResponse<UnitRecord>>(
    `companies/${companyId}/units${buildQueryString(query)}`,
  );

export const getUnit = (companyId: string, unitId: string) =>
  apiRequest<UnitRecord>(`companies/${companyId}/units/${unitId}`);

export const createUnit = (companyId: string, payload: CreateUnitPayload) =>
  apiRequest<UnitRecord>(`companies/${companyId}/units`, {
    method: 'POST',
    body: payload,
  });

export const updateUnit = (
  companyId: string,
  unitId: string,
  payload: UpdateUnitPayload,
) =>
  apiRequest<UnitRecord>(`companies/${companyId}/units/${unitId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateUnit = (companyId: string, unitId: string) =>
  apiRequest<UnitRecord>(`companies/${companyId}/units/${unitId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateUnit = (companyId: string, unitId: string) =>
  apiRequest<UnitRecord>(`companies/${companyId}/units/${unitId}/deactivate`, {
    method: 'POST',
    body: {},
  });
