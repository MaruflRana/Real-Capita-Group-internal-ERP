import type {
  BlockRecord,
  ProjectPhaseRecord,
  ProjectRecord,
  UnitRecord,
  UnitStatusRecord,
  ZoneRecord,
} from '../../lib/api/types';

export const PAGE_SIZE = 10;
export const OPTION_PAGE_SIZE = 100;

export const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const normalizeNullableId = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

export const getStatusQueryValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const formatFixedStatusLabel = (unitStatus: UnitStatusRecord) =>
  `${unitStatus.name} (${unitStatus.code})`;

export const getProjectLabel = (project: Pick<ProjectRecord, 'code' | 'name'>) =>
  `${project.code} - ${project.name}`;

export const getPhaseLabel = (
  phase: Pick<ProjectPhaseRecord, 'code' | 'name' | 'projectCode'>,
) => `${phase.projectCode} / ${phase.code} - ${phase.name}`;

export const getBlockLabel = (
  block: Pick<BlockRecord, 'code' | 'name' | 'projectCode' | 'phaseCode'>,
) =>
  `${block.projectCode}${block.phaseCode ? ` / ${block.phaseCode}` : ''} / ${block.code} - ${block.name}`;

export const getZoneLabel = (
  zone: Pick<ZoneRecord, 'code' | 'name' | 'projectCode' | 'blockCode'>,
) =>
  `${zone.projectCode}${zone.blockCode ? ` / ${zone.blockCode}` : ''} / ${zone.code} - ${zone.name}`;

export const formatUnitHierarchy = (unit: UnitRecord) =>
  [
    unit.projectCode,
    unit.phaseCode,
    unit.blockCode,
    unit.zoneCode,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' / ');
