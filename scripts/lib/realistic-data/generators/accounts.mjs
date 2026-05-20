// ── Chart of accounts generator: account classes, groups, ledgers, particulars ──

import {
  ACCOUNT_CLASS_SPECS, ACCOUNT_GROUP_SPECS, LEDGER_ACCOUNT_SPECS,
  PARTICULAR_ACCOUNT_SPECS,
} from '../config.mjs';
import { RefMap } from '../shared.mjs';

export const seedAccounts = async (tx, companyId, refs) => {
  // ── Account classes (global, upsert only) ──────────────────────────
  const accountClasses = {};

  for (const classSpec of ACCOUNT_CLASS_SPECS) {
    const accountClass = await tx.accountClass.upsert({
      where: { code: classSpec.code },
      create: {
        code: classSpec.code,
        name: classSpec.name,
        naturalBalance: classSpec.naturalBalance,
        sortOrder: classSpec.sortOrder,
        isActive: true,
      },
      update: {
        name: classSpec.name,
        naturalBalance: classSpec.naturalBalance,
        sortOrder: classSpec.sortOrder,
        isActive: true,
      },
    });
    accountClasses[classSpec.code] = accountClass;
    refs.set('accountClass', classSpec.code, accountClass.id);
  }

  // ── Account groups ────────────────────────────────────────────────
  for (const groupSpec of ACCOUNT_GROUP_SPECS) {
    const accountClassId = refs.get('accountClass', groupSpec.classCode);
    const group = await tx.accountGroup.create({
      data: {
        companyId,
        accountClassId,
        code: groupSpec.code,
        name: groupSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('accountGroup', groupSpec.code, group.id);
  }

  // ── Ledger accounts ───────────────────────────────────────────────
  for (const ledgerSpec of LEDGER_ACCOUNT_SPECS) {
    const accountGroupId = refs.get('accountGroup', ledgerSpec.groupCode);
    const ledger = await tx.ledgerAccount.create({
      data: {
        companyId,
        accountGroupId,
        code: ledgerSpec.code,
        name: ledgerSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('ledgerAccount', ledgerSpec.code, ledger.id);
  }

  // ── Particular accounts ───────────────────────────────────────────
  for (const particularSpec of PARTICULAR_ACCOUNT_SPECS) {
    const ledgerAccountId = refs.get('ledgerAccount', particularSpec.ledgerCode);
    const particular = await tx.particularAccount.create({
      data: {
        companyId,
        ledgerAccountId,
        code: particularSpec.code,
        name: particularSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('particularAccount', particularSpec.code, particular.id);
  }

  return { accountClasses };
};
