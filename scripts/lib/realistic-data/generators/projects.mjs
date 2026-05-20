// ── Projects generator: projects, phases, blocks, zones, unit types, units ──

import {
  PROJECT_SPECS, UNIT_TYPE_SPECS, UNIT_STATUS_CODES,
} from '../config.mjs';
import { SeededRandom, RefMap, Sequences, dateOnly } from '../shared.mjs';

// ── Block/Zone naming patterns ────────────────────────────────────────

const BLOCK_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const ZONE_NAMES = ['North', 'South', 'East', 'West', 'Central', 'Market', 'Garden', 'River', 'Lake', 'Hill'];
const ZONE_CODES = ['N', 'S', 'E', 'W', 'C', 'M', 'G', 'R', 'L', 'H'];

const SIZE_PATTERNS = {
  PLOT: ['2P5', '3', '5', '7P5', '10'], // katha sizes
  APT: ['1B', '2B', '3B'], // bedroom counts
  COMM: ['SM', 'MD', 'LG'],
  SHARE: ['1', '2', '5'],
  DUPLEX: ['2B', '3B'],
  TRIPLEX: ['3B'],
  'STD-DELUXE': ['STD'],
  'DELUXE-SUITE': ['DLX'],
  'EXEC-SUITE': ['EXEC'],
  'PRES-SUITE': ['PRES'],
};

export const seedProjects = async (tx, companyId, refs, rng, seqs) => {
  // ── Unit types ─────────────────────────────────────────────────────
  for (const typeSpec of UNIT_TYPE_SPECS) {
    const unitType = await tx.unitType.create({
      data: {
        companyId,
        code: typeSpec.code,
        name: typeSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('unitType', typeSpec.code, unitType.id);
  }

  // ── Unit statuses (system-seeded; verify but do not create new) ────
  // Verify all required statuses exist
  for (const statusCode of UNIT_STATUS_CODES) {
    const status = await tx.unitStatus.findUnique({ where: { code: statusCode } });
    if (!status) {
      throw new Error(`Required unit status '${statusCode}' not found. Run application bootstrap first.`);
    }
    refs.set('unitStatus', statusCode, status.id);
  }

  // ── Projects ───────────────────────────────────────────────────────
  for (const projectSpec of PROJECT_SPECS) {
    const locationId = refs.get('location', projectSpec.locationCode);
    const project = await tx.project.create({
      data: {
        companyId,
        locationId,
        code: projectSpec.code,
        name: projectSpec.name,
        description: `${projectSpec.name} — ${projectSpec.location}`,
        isActive: true,
        createdAt: dateOnly(2022, 1, rng.nextInt(1, 28)),
      },
    });
    refs.set('project', projectSpec.code, project.id);

    // ── Phases ────────────────────────────────────────────────────────
    const phaseCount = rng.nextInt(1, 3);
    for (let pi = 1; pi <= phaseCount; pi += 1) {
      const phaseCode = `PH${pi}`;
      const phaseName = `Phase ${pi}`;
      const phase = await tx.projectPhase.create({
        data: {
          projectId: project.id,
          code: phaseCode,
          name: phaseName,
          description: null,
          isActive: true,
        },
      });
      refs.set('projectPhase', `${projectSpec.code}-${phaseCode}`, phase.id);
    }

    // ── Blocks ────────────────────────────────────────────────────────
    const blockCount = rng.nextInt(2, 5);
    const usedBlocks = rng.shuffle(BLOCK_LETTERS).slice(0, blockCount);
    for (const blockLetter of usedBlocks) {
      const blockCode = blockLetter;
      const blockName = `Block ${blockLetter}`;
      const phaseKey = `${projectSpec.code}-PH${rng.nextInt(1, phaseCount)}`;
      const phaseId = refs.get('projectPhase', phaseKey);
      const block = await tx.block.create({
        data: {
          projectId: project.id,
          phaseId,
          code: blockCode,
          name: blockName,
          description: null,
          isActive: true,
        },
      });
      refs.set('block', `${projectSpec.code}-${blockCode}`, block.id);
    }

    // ── Zones ─────────────────────────────────────────────────────────
    const zoneCount = rng.nextInt(2, 4);
    const usedZoneIndices = rng.shuffle([...Array(ZONE_CODES.length).keys()]).slice(0, zoneCount);
    for (const zi of usedZoneIndices) {
      const zoneCode = ZONE_CODES[zi];
      const zoneName = ZONE_NAMES[zi] + ' Zone';
      const blockKey = `${projectSpec.code}-${rng.pick(usedBlocks)}`;
      const blockId = refs.get('block', blockKey);
      const zone = await tx.zone.create({
        data: {
          projectId: project.id,
          blockId,
          code: zoneCode,
          name: zoneName,
          description: null,
          isActive: true,
        },
      });
      refs.set('zone', `${projectSpec.code}-${zoneCode}`, zone.id);
    }

    // ── Units ─────────────────────────────────────────────────────────
    // All units start as AVAILABLE; CRM booking operations will organically
    // change statuses via database triggers.
    const unitTypeCodes = projectSpec.unitTypeCodes || ['PLOT'];
    const totalUnits = projectSpec.unitCount;
    const availableStatusId = refs.get('unitStatus', 'AVAILABLE');

    // Generate units — all AVAILABLE
    const unitCodesInProject = new Set();
    let unitSeq = 0;
    const blockKeys = usedBlocks.map(b => `${projectSpec.code}-${b}`);
    const zoneKeys = usedZoneIndices.map(zi => `${projectSpec.code}-${ZONE_CODES[zi]}`);

    const generateUniqueUnitCode = (baseCode) => {
      let code = baseCode;
      let suffix = 1;
      while (unitCodesInProject.has(code)) {
        code = `${baseCode}-${suffix}`;
        suffix += 1;
      }
      unitCodesInProject.add(code);
      return code;
    };

    for (let u = 0; u < totalUnits; u += 1) {
      unitSeq += 1;
      const unitTypeCode = rng.pick(unitTypeCodes);
      const unitTypeId = refs.get('unitType', unitTypeCode);
      const sizes = SIZE_PATTERNS[unitTypeCode] || ['1'];
      const size = rng.pick(sizes);

      let unitCodeBase, unitName;
      if (['PLOT', 'SHARE'].includes(unitTypeCode)) {
        const block = rng.pick(usedBlocks);
        const zone = rng.pick(usedZoneIndices.map(zi => ZONE_CODES[zi]));
        unitCodeBase = `${projectSpec.code}-${block}-${zone}-${size}-${String(unitSeq).padStart(3, '0')}`;
        unitName = `${projectSpec.name} ${block}-${zone}-${size}-${String(unitSeq).padStart(3, '0')}`;
      } else if (['APT', 'COMM', 'DUPLEX', 'TRIPLEX'].includes(unitTypeCode)) {
        unitCodeBase = `${projectSpec.code}-${unitTypeCode}-${String(unitSeq).padStart(3, '0')}`;
        unitName = `${projectSpec.name} ${unitTypeCode}-${String(unitSeq).padStart(3, '0')}`;
      } else {
        // Suite types
        unitCodeBase = `${projectSpec.code}-${size}-${String(unitSeq).padStart(3, '0')}`;
        unitName = `${projectSpec.name} ${size}-${String(unitSeq).padStart(3, '0')}`;
      }

      const unitCode = generateUniqueUnitCode(unitCodeBase);

      const phaseKey = `${projectSpec.code}-PH${rng.nextInt(1, phaseCount)}`;
      const phaseId = refs.get('projectPhase', phaseKey);
      const blockId = rng.chance(0.8) ? refs.get('block', rng.pick(blockKeys)) : null;
      const zoneId = rng.chance(0.7) ? refs.get('zone', rng.pick(zoneKeys)) : null;

      const createdAtYear = rng.nextInt(2022, 2025);
      const createdAtMonth = rng.nextInt(1, 12);

      await tx.unit.create({
        data: {
          projectId: project.id,
          phaseId,
          blockId,
          zoneId,
          unitTypeId,
          unitStatusId: availableStatusId,
          code: unitCode,
          name: unitName,
          description: null,
          isActive: true,
          createdAt: dateOnly(createdAtYear, createdAtMonth, rng.nextInt(1, 28)),
        },
      });

      refs.set('unit', unitCode, { id: null, code: unitCode, projectId: project.id, unitTypeCode, statusCode: 'AVAILABLE' });
    }
  }

  // After all units are created, fetch actual IDs for units we'll reference later
  // Unit model doesn't have companyId — filter through project relation
  const allUnits = await tx.unit.findMany({
    where: {
      project: { companyId },
    },
    select: { id: true, code: true, projectId: true },
  });

  for (const unit of allUnits) {
    const existing = refs.get('unit', unit.code);
    if (existing) {
      existing.id = unit.id;
    }
  }

  // Collect available/booked/sold unit codes for CRM
  const availableUnits = [];
  const bookedUnits = [];
  const soldUnits = [];
  for (const unit of allUnits) {
    availableUnits.push(unit);  // All units are AVAILABLE at seed time
  }

  refs.set('unitPool', 'available', availableUnits);
  refs.set('unitPool', 'booked', bookedUnits);
  refs.set('unitPool', 'sold', soldUnits);
};
