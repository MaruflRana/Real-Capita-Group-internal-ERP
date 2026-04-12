'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listLocations } from '../../lib/api/org-security';
import {
  activateBlock,
  activateCostCenter,
  activateProject,
  activateProjectPhase,
  activateUnit,
  activateUnitType,
  activateZone,
  createBlock,
  createCostCenter,
  createProject,
  createProjectPhase,
  createUnit,
  createUnitType,
  createZone,
  deactivateBlock,
  deactivateCostCenter,
  deactivateProject,
  deactivateProjectPhase,
  deactivateUnit,
  deactivateUnitType,
  deactivateZone,
  getBlock,
  getCostCenter,
  getProject,
  getProjectPhase,
  getUnit,
  getUnitType,
  getZone,
  listBlocks,
  listCostCenters,
  listProjectPhases,
  listProjects,
  listUnits,
  listUnitStatuses,
  listUnitTypes,
  listZones,
  updateBlock,
  updateCostCenter,
  updateProject,
  updateProjectPhase,
  updateUnit,
  updateUnitType,
  updateZone,
} from '../../lib/api/project-property';
import type {
  BlockListQueryParams,
  CostCenterListQueryParams,
  CreateBlockPayload,
  CreateCostCenterPayload,
  CreateProjectPayload,
  CreateProjectPhasePayload,
  CreateUnitPayload,
  CreateUnitTypePayload,
  CreateZonePayload,
  ListQueryParams,
  ProjectListQueryParams,
  ProjectPhaseListQueryParams,
  UnitListQueryParams,
  UnitStatusListQueryParams,
  UnitTypeListQueryParams,
  UpdateBlockPayload,
  UpdateCostCenterPayload,
  UpdateProjectPayload,
  UpdateProjectPhasePayload,
  UpdateUnitPayload,
  UpdateUnitTypePayload,
  UpdateZonePayload,
  ZoneListQueryParams,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error(
      'A company context is required for project and property operations.',
    );
  }

  return companyId;
};

export const projectPropertyKeys = {
  all: (companyId: string) => ['project-property', companyId] as const,
  locations: (companyId: string, query: ListQueryParams) =>
    ['project-property', companyId, 'locations', query] as const,
  projects: (companyId: string, query: ProjectListQueryParams) =>
    ['project-property', companyId, 'projects', query] as const,
  project: (companyId: string, projectId: string) =>
    ['project-property', companyId, 'project', projectId] as const,
  costCenters: (companyId: string, query: CostCenterListQueryParams) =>
    ['project-property', companyId, 'cost-centers', query] as const,
  costCenter: (companyId: string, costCenterId: string) =>
    ['project-property', companyId, 'cost-center', costCenterId] as const,
  projectPhases: (companyId: string, query: ProjectPhaseListQueryParams) =>
    ['project-property', companyId, 'project-phases', query] as const,
  projectPhase: (companyId: string, projectPhaseId: string) =>
    ['project-property', companyId, 'project-phase', projectPhaseId] as const,
  blocks: (companyId: string, query: BlockListQueryParams) =>
    ['project-property', companyId, 'blocks', query] as const,
  block: (companyId: string, blockId: string) =>
    ['project-property', companyId, 'block', blockId] as const,
  zones: (companyId: string, query: ZoneListQueryParams) =>
    ['project-property', companyId, 'zones', query] as const,
  zone: (companyId: string, zoneId: string) =>
    ['project-property', companyId, 'zone', zoneId] as const,
  unitTypes: (companyId: string, query: UnitTypeListQueryParams) =>
    ['project-property', companyId, 'unit-types', query] as const,
  unitType: (companyId: string, unitTypeId: string) =>
    ['project-property', companyId, 'unit-type', unitTypeId] as const,
  unitStatuses: (companyId: string, query: UnitStatusListQueryParams) =>
    ['project-property', companyId, 'unit-statuses', query] as const,
  units: (companyId: string, query: UnitListQueryParams) =>
    ['project-property', companyId, 'units', query] as const,
  unit: (companyId: string, unitId: string) =>
    ['project-property', companyId, 'unit', unitId] as const,
};

const invalidateProjectProperty = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | undefined,
) => {
  if (!companyId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: projectPropertyKeys.all(companyId),
  });
};

export const useCompanyLocations = (
  companyId: string | undefined,
  query: ListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.locations(companyId ?? 'no-company', query),
    queryFn: () => listLocations(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useProjects = (
  companyId: string | undefined,
  query: ProjectListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.projects(companyId ?? 'no-company', query),
    queryFn: () => listProjects(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useProject = (
  companyId: string | undefined,
  projectId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.project(companyId ?? 'no-company', projectId),
    queryFn: () => getProject(assertCompanyId(companyId), projectId),
    enabled: enabled && Boolean(companyId) && projectId.length > 0,
  });

export const useSaveProject = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId?: string;
      payload: CreateProjectPayload | UpdateProjectPayload;
    }) =>
      projectId
        ? updateProject(
            assertCompanyId(companyId),
            projectId,
            payload as UpdateProjectPayload,
          )
        : createProject(
            assertCompanyId(companyId),
            payload as CreateProjectPayload,
          ),
    onSuccess: async (project) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.project(companyId, project.id),
          project,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleProject = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      isActive,
    }: {
      projectId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateProject(assertCompanyId(companyId), projectId)
        : activateProject(assertCompanyId(companyId), projectId),
    onSuccess: async (project) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.project(companyId, project.id),
          project,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useCostCenters = (
  companyId: string | undefined,
  query: CostCenterListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.costCenters(companyId ?? 'no-company', query),
    queryFn: () => listCostCenters(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCostCenter = (
  companyId: string | undefined,
  costCenterId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.costCenter(
      companyId ?? 'no-company',
      costCenterId,
    ),
    queryFn: () => getCostCenter(assertCompanyId(companyId), costCenterId),
    enabled: enabled && Boolean(companyId) && costCenterId.length > 0,
  });

export const useSaveCostCenter = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      costCenterId,
      payload,
    }: {
      costCenterId?: string;
      payload: CreateCostCenterPayload | UpdateCostCenterPayload;
    }) =>
      costCenterId
        ? updateCostCenter(
            assertCompanyId(companyId),
            costCenterId,
            payload as UpdateCostCenterPayload,
          )
        : createCostCenter(
            assertCompanyId(companyId),
            payload as CreateCostCenterPayload,
          ),
    onSuccess: async (costCenter) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.costCenter(companyId, costCenter.id),
          costCenter,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleCostCenter = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      costCenterId,
      isActive,
    }: {
      costCenterId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateCostCenter(assertCompanyId(companyId), costCenterId)
        : activateCostCenter(assertCompanyId(companyId), costCenterId),
    onSuccess: async (costCenter) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.costCenter(companyId, costCenter.id),
          costCenter,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useProjectPhases = (
  companyId: string | undefined,
  query: ProjectPhaseListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.projectPhases(companyId ?? 'no-company', query),
    queryFn: () => listProjectPhases(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useProjectPhase = (
  companyId: string | undefined,
  projectPhaseId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.projectPhase(
      companyId ?? 'no-company',
      projectPhaseId,
    ),
    queryFn: () => getProjectPhase(assertCompanyId(companyId), projectPhaseId),
    enabled: enabled && Boolean(companyId) && projectPhaseId.length > 0,
  });

export const useSaveProjectPhase = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectPhaseId,
      payload,
    }: {
      projectPhaseId?: string;
      payload: CreateProjectPhasePayload | UpdateProjectPhasePayload;
    }) =>
      projectPhaseId
        ? updateProjectPhase(
            assertCompanyId(companyId),
            projectPhaseId,
            payload as UpdateProjectPhasePayload,
          )
        : createProjectPhase(
            assertCompanyId(companyId),
            payload as CreateProjectPhasePayload,
          ),
    onSuccess: async (projectPhase) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.projectPhase(companyId, projectPhase.id),
          projectPhase,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleProjectPhase = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectPhaseId,
      isActive,
    }: {
      projectPhaseId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateProjectPhase(assertCompanyId(companyId), projectPhaseId)
        : activateProjectPhase(assertCompanyId(companyId), projectPhaseId),
    onSuccess: async (projectPhase) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.projectPhase(companyId, projectPhase.id),
          projectPhase,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useBlocks = (
  companyId: string | undefined,
  query: BlockListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.blocks(companyId ?? 'no-company', query),
    queryFn: () => listBlocks(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useBlock = (
  companyId: string | undefined,
  blockId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.block(companyId ?? 'no-company', blockId),
    queryFn: () => getBlock(assertCompanyId(companyId), blockId),
    enabled: enabled && Boolean(companyId) && blockId.length > 0,
  });

export const useSaveBlock = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      blockId,
      payload,
    }: {
      blockId?: string;
      payload: CreateBlockPayload | UpdateBlockPayload;
    }) =>
      blockId
        ? updateBlock(
            assertCompanyId(companyId),
            blockId,
            payload as UpdateBlockPayload,
          )
        : createBlock(assertCompanyId(companyId), payload as CreateBlockPayload),
    onSuccess: async (block) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.block(companyId, block.id), block);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleBlock = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      blockId,
      isActive,
    }: {
      blockId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateBlock(assertCompanyId(companyId), blockId)
        : activateBlock(assertCompanyId(companyId), blockId),
    onSuccess: async (block) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.block(companyId, block.id), block);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useZones = (
  companyId: string | undefined,
  query: ZoneListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.zones(companyId ?? 'no-company', query),
    queryFn: () => listZones(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useZone = (
  companyId: string | undefined,
  zoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.zone(companyId ?? 'no-company', zoneId),
    queryFn: () => getZone(assertCompanyId(companyId), zoneId),
    enabled: enabled && Boolean(companyId) && zoneId.length > 0,
  });

export const useSaveZone = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      zoneId,
      payload,
    }: {
      zoneId?: string;
      payload: CreateZonePayload | UpdateZonePayload;
    }) =>
      zoneId
        ? updateZone(
            assertCompanyId(companyId),
            zoneId,
            payload as UpdateZonePayload,
          )
        : createZone(assertCompanyId(companyId), payload as CreateZonePayload),
    onSuccess: async (zone) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.zone(companyId, zone.id), zone);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleZone = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      zoneId,
      isActive,
    }: {
      zoneId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateZone(assertCompanyId(companyId), zoneId)
        : activateZone(assertCompanyId(companyId), zoneId),
    onSuccess: async (zone) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.zone(companyId, zone.id), zone);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useUnitTypes = (
  companyId: string | undefined,
  query: UnitTypeListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.unitTypes(companyId ?? 'no-company', query),
    queryFn: () => listUnitTypes(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useUnitType = (
  companyId: string | undefined,
  unitTypeId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.unitType(companyId ?? 'no-company', unitTypeId),
    queryFn: () => getUnitType(assertCompanyId(companyId), unitTypeId),
    enabled: enabled && Boolean(companyId) && unitTypeId.length > 0,
  });

export const useSaveUnitType = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unitTypeId,
      payload,
    }: {
      unitTypeId?: string;
      payload: CreateUnitTypePayload | UpdateUnitTypePayload;
    }) =>
      unitTypeId
        ? updateUnitType(
            assertCompanyId(companyId),
            unitTypeId,
            payload as UpdateUnitTypePayload,
          )
        : createUnitType(
            assertCompanyId(companyId),
            payload as CreateUnitTypePayload,
          ),
    onSuccess: async (unitType) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.unitType(companyId, unitType.id),
          unitType,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleUnitType = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unitTypeId,
      isActive,
    }: {
      unitTypeId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateUnitType(assertCompanyId(companyId), unitTypeId)
        : activateUnitType(assertCompanyId(companyId), unitTypeId),
    onSuccess: async (unitType) => {
      if (companyId) {
        queryClient.setQueryData(
          projectPropertyKeys.unitType(companyId, unitType.id),
          unitType,
        );
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useUnitStatuses = (
  companyId: string | undefined,
  query: UnitStatusListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.unitStatuses(companyId ?? 'no-company', query),
    queryFn: () => listUnitStatuses(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useUnits = (
  companyId: string | undefined,
  query: UnitListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.units(companyId ?? 'no-company', query),
    queryFn: () => listUnits(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useUnit = (
  companyId: string | undefined,
  unitId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: projectPropertyKeys.unit(companyId ?? 'no-company', unitId),
    queryFn: () => getUnit(assertCompanyId(companyId), unitId),
    enabled: enabled && Boolean(companyId) && unitId.length > 0,
  });

export const useSaveUnit = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId?: string;
      payload: CreateUnitPayload | UpdateUnitPayload;
    }) =>
      unitId
        ? updateUnit(
            assertCompanyId(companyId),
            unitId,
            payload as UpdateUnitPayload,
          )
        : createUnit(assertCompanyId(companyId), payload as CreateUnitPayload),
    onSuccess: async (unit) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.unit(companyId, unit.id), unit);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};

export const useToggleUnit = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      unitId,
      isActive,
    }: {
      unitId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateUnit(assertCompanyId(companyId), unitId)
        : activateUnit(assertCompanyId(companyId), unitId),
    onSuccess: async (unit) => {
      if (companyId) {
        queryClient.setQueryData(projectPropertyKeys.unit(companyId, unit.id), unit);
      }

      await invalidateProjectProperty(queryClient, companyId);
    },
  });
};
