// ── Organization generator: company, roles, locations, departments ────
// Cost centers are seeded after projects in the orchestrator to resolve project ID references.

import {
  COMPANY_NAME, COMPANY_SLUG, ROLE_DEFINITIONS, LOCATION_SPECS,
  DEPARTMENT_SPECS,
} from '../config.mjs';
import { RefMap, Sequences } from '../shared.mjs';

export const seedOrganization = async (tx, companyId, refs, seqs) => {
  // ── Roles (global, upsert only) ────────────────────────────────────
  const roles = {};

  for (const roleSpec of ROLE_DEFINITIONS) {
    const role = await tx.role.upsert({
      where: { code: roleSpec.code },
      create: { ...roleSpec, isActive: true },
      update: { name: roleSpec.name, description: roleSpec.description, isActive: true },
    });
    roles[role.code] = role;
    refs.set('role', roleSpec.code, role.id);
  }

  // ── Locations ──────────────────────────────────────────────────────
  for (const locSpec of LOCATION_SPECS) {
    const location = await tx.location.create({
      data: {
        companyId,
        code: locSpec.code,
        name: locSpec.name,
        description: locSpec.description || null,
        isActive: true,
      },
    });
    refs.set('location', locSpec.code, location.id);
  }

  // ── Departments ────────────────────────────────────────────────────
  for (const deptSpec of DEPARTMENT_SPECS) {
    const department = await tx.department.create({
      data: {
        companyId,
        code: deptSpec.code,
        name: deptSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('department', deptSpec.code, department.id);
  }

  return { roles };
};

// ── Cost center seeding (called after projects are seeded) ────────────
export const seedCostCenters = async (tx, companyId, refs) => {
  const COST_CENTER_SPECS = [
    { code: 'CC-CORP', name: 'Corporate Operations', projectCode: null },
    { code: 'CC-MAYA', name: 'Maya Kanon Operations', projectCode: 'RC-MAYA' },
    { code: 'CC-RIVERY', name: 'Rivery Village Operations', projectCode: 'RC-RIVERY' },
    { code: 'CC-PRIYOJAN', name: 'Priyojan Operations', projectCode: 'RC-PRIYOJAN' },
    { code: 'CC-VALLEY', name: 'South Valley Operations', projectCode: 'RC-SOUTH-VALLEY' },
    { code: 'CC-ECO', name: 'Eco Village Operations', projectCode: 'RC-MAYA-ECO' },
    { code: 'CC-BONDHUJON', name: 'Bondhujon Operations', projectCode: 'RC-BONDHUJON' },
    { code: 'CC-OCEAN', name: 'Ocean Bliss Operations', projectCode: 'RC-OCEAN-BLISS' },
    { code: 'CC-DAIRA', name: 'Daira Noor Operations', projectCode: 'RC-DAIRA-NOOR' },
    { code: 'CC-SHANTI', name: 'Shanti Kuthir Operations', projectCode: 'RC-SHANTI-KUTHIR' },
    { code: 'CC-DALIM', name: 'Dalim Tower Operations', projectCode: 'RC-DALIM-TOWER' },
  ];

  for (const ccSpec of COST_CENTER_SPECS) {
    const projectId = ccSpec.projectCode ? refs.get('project', ccSpec.projectCode) : null;
    const costCenter = await tx.costCenter.create({
      data: {
        companyId,
        code: ccSpec.code,
        name: ccSpec.name,
        description: null,
        projectId,
        isActive: true,
      },
    });
    refs.set('costCenter', ccSpec.code, costCenter.id);
  }
};
