import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import {
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type {
  AccountClassesListQueryDto,
  AccountClassDto,
} from './dto/account-classes.dto';
import type {
  AccountGroupDto,
  AccountGroupsListQueryDto,
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
} from './dto/account-groups.dto';
import type {
  CreateLedgerAccountDto,
  LedgerAccountDto,
  LedgerAccountsListQueryDto,
  UpdateLedgerAccountDto,
} from './dto/ledger-accounts.dto';
import type {
  CreateParticularAccountDto,
  ParticularAccountDto,
  ParticularAccountsListQueryDto,
  UpdateParticularAccountDto,
} from './dto/particular-accounts.dto';

const ACCOUNT_CLASS_SORT_FIELDS = ['code', 'name', 'sortOrder', 'updatedAt'] as const;
const ACCOUNT_GROUP_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const LEDGER_ACCOUNT_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const PARTICULAR_ACCOUNT_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;

type AccountClassRecord = Prisma.AccountClassGetPayload<object>;
type AccountGroupRecord = Prisma.AccountGroupGetPayload<{
  include: {
    accountClass: true;
  };
}>;
type LedgerAccountRecord = Prisma.LedgerAccountGetPayload<{
  include: {
    accountGroup: {
      include: {
        accountClass: true;
      };
    };
  };
}>;
type ParticularAccountRecord = Prisma.ParticularAccountGetPayload<{
  include: {
    ledgerAccount: {
      include: {
        accountGroup: {
          include: {
            accountClass: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccountClasses(
    companyId: string,
    query: AccountClassesListQueryDto,
  ) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.AccountClassWhereInput = {
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      ACCOUNT_CLASS_SORT_FIELDS,
      'sortOrder',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AccountClassOrderByWithRelationInput;
    const [accountClasses, total] = await Promise.all([
      this.prisma.accountClass.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.accountClass.count({
        where,
      }),
    ]);

    return {
      items: accountClasses.map((accountClass) =>
        this.mapAccountClass(accountClass),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listAccountGroups(companyId: string, query: AccountGroupsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.AccountGroupWhereInput = {
      companyId,
      ...(query.accountClassId
        ? {
            accountClassId: query.accountClassId,
          }
        : {}),
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      ACCOUNT_GROUP_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AccountGroupOrderByWithRelationInput;
    const [accountGroups, total] = await Promise.all([
      this.prisma.accountGroup.findMany({
        where,
        include: {
          accountClass: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.accountGroup.count({
        where,
      }),
    ]);

    return {
      items: accountGroups.map((accountGroup) =>
        this.mapAccountGroup(accountGroup),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getAccountGroupDetail(companyId: string, accountGroupId: string) {
    const accountGroup = await this.getAccountGroupRecord(companyId, accountGroupId);

    return this.mapAccountGroup(accountGroup);
  }

  async createAccountGroup(
    companyId: string,
    createAccountGroupDto: CreateAccountGroupDto,
  ) {
    await this.assertCompanyExists(companyId);
    await this.assertActiveAccountClass(createAccountGroupDto.accountClassId);

    const normalizedInput = this.normalizeCodeNameInput(createAccountGroupDto);

    await this.assertAccountGroupUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const accountGroup = await this.prisma.accountGroup.create({
        data: {
          companyId,
          accountClassId: createAccountGroupDto.accountClassId,
          ...normalizedInput,
        },
        include: {
          accountClass: true,
        },
      });

      return this.mapAccountGroup(accountGroup);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'An account group with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateAccountGroup(
    companyId: string,
    accountGroupId: string,
    updateAccountGroupDto: UpdateAccountGroupDto,
  ) {
    const existingAccountGroup = await this.getAccountGroupRecord(
      companyId,
      accountGroupId,
    );
    const accountClassId =
      updateAccountGroupDto.accountClassId ?? existingAccountGroup.accountClassId;

    await this.assertActiveAccountClass(accountClassId);

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateAccountGroupDto.code ?? existingAccountGroup.code,
      name: updateAccountGroupDto.name ?? existingAccountGroup.name,
      description:
        updateAccountGroupDto.description === undefined
          ? existingAccountGroup.description ?? undefined
          : updateAccountGroupDto.description,
    });

    await this.assertAccountGroupUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingAccountGroup.id,
    );

    try {
      const accountGroup = await this.prisma.accountGroup.update({
        where: {
          id: existingAccountGroup.id,
        },
        data: {
          accountClassId,
          ...normalizedInput,
        },
        include: {
          accountClass: true,
        },
      });

      return this.mapAccountGroup(accountGroup);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'An account group with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setAccountGroupActiveState(
    companyId: string,
    accountGroupId: string,
    isActive: boolean,
  ) {
    await this.getAccountGroupRecord(companyId, accountGroupId);

    if (!isActive) {
      await this.assertNoActiveLedgerAccounts(accountGroupId);
    }

    const accountGroup = await this.prisma.accountGroup.update({
      where: {
        id: accountGroupId,
      },
      data: {
        isActive,
      },
      include: {
        accountClass: true,
      },
    });

    return this.mapAccountGroup(accountGroup);
  }

  async listLedgerAccounts(companyId: string, query: LedgerAccountsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.LedgerAccountWhereInput = {
      companyId,
      ...(query.accountGroupId
        ? {
            accountGroupId: query.accountGroupId,
          }
        : {}),
      ...(query.accountClassId
        ? {
            accountGroup: {
              accountClassId: query.accountClassId,
            },
          }
        : {}),
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      LEDGER_ACCOUNT_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LedgerAccountOrderByWithRelationInput;
    const [ledgerAccounts, total] = await Promise.all([
      this.prisma.ledgerAccount.findMany({
        where,
        include: {
          accountGroup: {
            include: {
              accountClass: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.ledgerAccount.count({
        where,
      }),
    ]);

    return {
      items: ledgerAccounts.map((ledgerAccount) =>
        this.mapLedgerAccount(ledgerAccount),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getLedgerAccountDetail(companyId: string, ledgerAccountId: string) {
    const ledgerAccount = await this.getLedgerAccountRecord(
      companyId,
      ledgerAccountId,
    );

    return this.mapLedgerAccount(ledgerAccount);
  }

  async createLedgerAccount(
    companyId: string,
    createLedgerAccountDto: CreateLedgerAccountDto,
  ) {
    await this.assertCompanyExists(companyId);
    await this.assertActiveAccountGroup(companyId, createLedgerAccountDto.accountGroupId);

    const normalizedInput = this.normalizeCodeNameInput(createLedgerAccountDto);

    await this.assertLedgerAccountUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const ledgerAccount = await this.prisma.ledgerAccount.create({
        data: {
          companyId,
          accountGroupId: createLedgerAccountDto.accountGroupId,
          ...normalizedInput,
        },
        include: {
          accountGroup: {
            include: {
              accountClass: true,
            },
          },
        },
      });

      return this.mapLedgerAccount(ledgerAccount);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A ledger account with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateLedgerAccount(
    companyId: string,
    ledgerAccountId: string,
    updateLedgerAccountDto: UpdateLedgerAccountDto,
  ) {
    const existingLedgerAccount = await this.getLedgerAccountRecord(
      companyId,
      ledgerAccountId,
    );
    const accountGroupId =
      updateLedgerAccountDto.accountGroupId ?? existingLedgerAccount.accountGroupId;

    await this.assertActiveAccountGroup(companyId, accountGroupId);

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateLedgerAccountDto.code ?? existingLedgerAccount.code,
      name: updateLedgerAccountDto.name ?? existingLedgerAccount.name,
      description:
        updateLedgerAccountDto.description === undefined
          ? existingLedgerAccount.description ?? undefined
          : updateLedgerAccountDto.description,
    });

    await this.assertLedgerAccountUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingLedgerAccount.id,
    );

    try {
      const ledgerAccount = await this.prisma.ledgerAccount.update({
        where: {
          id: existingLedgerAccount.id,
        },
        data: {
          accountGroupId,
          ...normalizedInput,
        },
        include: {
          accountGroup: {
            include: {
              accountClass: true,
            },
          },
        },
      });

      return this.mapLedgerAccount(ledgerAccount);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A ledger account with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setLedgerAccountActiveState(
    companyId: string,
    ledgerAccountId: string,
    isActive: boolean,
  ) {
    await this.getLedgerAccountRecord(companyId, ledgerAccountId);

    if (!isActive) {
      await this.assertNoActiveParticularAccounts(ledgerAccountId);
    }

    const ledgerAccount = await this.prisma.ledgerAccount.update({
      where: {
        id: ledgerAccountId,
      },
      data: {
        isActive,
      },
      include: {
        accountGroup: {
          include: {
            accountClass: true,
          },
        },
      },
    });

    return this.mapLedgerAccount(ledgerAccount);
  }

  async listParticularAccounts(
    companyId: string,
    query: ParticularAccountsListQueryDto,
  ) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.ParticularAccountWhereInput = {
      companyId,
      ...(query.ledgerAccountId
        ? {
            ledgerAccountId: query.ledgerAccountId,
          }
        : {}),
      ...(query.accountGroupId || query.accountClassId
        ? {
            ledgerAccount: {
              ...(query.accountGroupId
                ? {
                    accountGroupId: query.accountGroupId,
                  }
                : {}),
              ...(query.accountClassId
                ? {
                    accountGroup: {
                      accountClassId: query.accountClassId,
                    },
                  }
                : {}),
            },
          }
        : {}),
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      PARTICULAR_ACCOUNT_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ParticularAccountOrderByWithRelationInput;
    const [particularAccounts, total] = await Promise.all([
      this.prisma.particularAccount.findMany({
        where,
        include: {
          ledgerAccount: {
            include: {
              accountGroup: {
                include: {
                  accountClass: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.particularAccount.count({
        where,
      }),
    ]);

    return {
      items: particularAccounts.map((particularAccount) =>
        this.mapParticularAccount(particularAccount),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getParticularAccountDetail(companyId: string, particularAccountId: string) {
    const particularAccount = await this.getParticularAccountRecord(
      companyId,
      particularAccountId,
    );

    return this.mapParticularAccount(particularAccount);
  }

  async createParticularAccount(
    companyId: string,
    createParticularAccountDto: CreateParticularAccountDto,
  ) {
    await this.assertCompanyExists(companyId);
    await this.assertActiveLedgerAccount(
      companyId,
      createParticularAccountDto.ledgerAccountId,
    );

    const normalizedInput = this.normalizeCodeNameInput(createParticularAccountDto);

    await this.assertParticularAccountUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const particularAccount = await this.prisma.particularAccount.create({
        data: {
          companyId,
          ledgerAccountId: createParticularAccountDto.ledgerAccountId,
          ...normalizedInput,
        },
        include: {
          ledgerAccount: {
            include: {
              accountGroup: {
                include: {
                  accountClass: true,
                },
              },
            },
          },
        },
      });

      return this.mapParticularAccount(particularAccount);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A particular account with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateParticularAccount(
    companyId: string,
    particularAccountId: string,
    updateParticularAccountDto: UpdateParticularAccountDto,
  ) {
    const existingParticularAccount = await this.getParticularAccountRecord(
      companyId,
      particularAccountId,
    );
    const ledgerAccountId =
      updateParticularAccountDto.ledgerAccountId ??
      existingParticularAccount.ledgerAccountId;

    await this.assertActiveLedgerAccount(companyId, ledgerAccountId);

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateParticularAccountDto.code ?? existingParticularAccount.code,
      name: updateParticularAccountDto.name ?? existingParticularAccount.name,
      description:
        updateParticularAccountDto.description === undefined
          ? existingParticularAccount.description ?? undefined
          : updateParticularAccountDto.description,
    });

    await this.assertParticularAccountUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingParticularAccount.id,
    );

    try {
      const particularAccount = await this.prisma.particularAccount.update({
        where: {
          id: existingParticularAccount.id,
        },
        data: {
          ledgerAccountId,
          ...normalizedInput,
        },
        include: {
          ledgerAccount: {
            include: {
              accountGroup: {
                include: {
                  accountClass: true,
                },
              },
            },
          },
        },
      });

      return this.mapParticularAccount(particularAccount);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A particular account with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setParticularAccountActiveState(
    companyId: string,
    particularAccountId: string,
    isActive: boolean,
  ) {
    await this.getParticularAccountRecord(companyId, particularAccountId);

    const particularAccount = await this.prisma.particularAccount.update({
      where: {
        id: particularAccountId,
      },
      data: {
        isActive,
      },
      include: {
        ledgerAccount: {
          include: {
            accountGroup: {
              include: {
                accountClass: true,
              },
            },
          },
        },
      },
    });

    return this.mapParticularAccount(particularAccount);
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  private async assertActiveAccountClass(accountClassId: string): Promise<void> {
    const accountClass = await this.prisma.accountClass.findUnique({
      where: {
        id: accountClassId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!accountClass) {
      throw new NotFoundException('Account class not found.');
    }

    if (!accountClass.isActive) {
      throw new BadRequestException(
        'Inactive account classes cannot be assigned to account groups.',
      );
    }
  }

  private async assertActiveAccountGroup(
    companyId: string,
    accountGroupId: string,
  ): Promise<void> {
    const accountGroup = await this.prisma.accountGroup.findFirst({
      where: {
        id: accountGroupId,
        companyId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!accountGroup) {
      throw new NotFoundException('Account group not found.');
    }

    if (!accountGroup.isActive) {
      throw new BadRequestException(
        'Inactive account groups cannot be assigned to ledger accounts.',
      );
    }
  }

  private async assertActiveLedgerAccount(
    companyId: string,
    ledgerAccountId: string,
  ): Promise<void> {
    const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        id: ledgerAccountId,
        companyId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!ledgerAccount) {
      throw new NotFoundException('Ledger account not found.');
    }

    if (!ledgerAccount.isActive) {
      throw new BadRequestException(
        'Inactive ledger accounts cannot be assigned to particular accounts.',
      );
    }
  }

  private async assertAccountGroupUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredAccountGroupId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.accountGroup.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredAccountGroupId
            ? {
                id: {
                  not: ignoredAccountGroupId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.accountGroup.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredAccountGroupId
            ? {
                id: {
                  not: ignoredAccountGroupId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'An account group with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'An account group with this name already exists in the company.',
      );
    }
  }

  private async assertLedgerAccountUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredLedgerAccountId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.ledgerAccount.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredLedgerAccountId
            ? {
                id: {
                  not: ignoredLedgerAccountId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.ledgerAccount.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredLedgerAccountId
            ? {
                id: {
                  not: ignoredLedgerAccountId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A ledger account with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A ledger account with this name already exists in the company.',
      );
    }
  }

  private async assertParticularAccountUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredParticularAccountId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.particularAccount.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredParticularAccountId
            ? {
                id: {
                  not: ignoredParticularAccountId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.particularAccount.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredParticularAccountId
            ? {
                id: {
                  not: ignoredParticularAccountId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A particular account with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A particular account with this name already exists in the company.',
      );
    }
  }

  private async assertNoActiveLedgerAccounts(accountGroupId: string) {
    const activeLedgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountGroupId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (activeLedgerAccount) {
      throw new BadRequestException(
        'Account groups with active ledger accounts cannot be deactivated.',
      );
    }
  }

  private async assertNoActiveParticularAccounts(ledgerAccountId: string) {
    const activeParticularAccount = await this.prisma.particularAccount.findFirst({
      where: {
        ledgerAccountId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (activeParticularAccount) {
      throw new BadRequestException(
        'Ledger accounts with active particular accounts cannot be deactivated.',
      );
    }
  }

  private async getAccountGroupRecord(companyId: string, accountGroupId: string) {
    await this.assertCompanyExists(companyId);

    const accountGroup = await this.prisma.accountGroup.findFirst({
      where: {
        id: accountGroupId,
        companyId,
      },
      include: {
        accountClass: true,
      },
    });

    if (!accountGroup) {
      throw new NotFoundException('Account group not found.');
    }

    return accountGroup;
  }

  private async getLedgerAccountRecord(
    companyId: string,
    ledgerAccountId: string,
  ) {
    await this.assertCompanyExists(companyId);

    const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        id: ledgerAccountId,
        companyId,
      },
      include: {
        accountGroup: {
          include: {
            accountClass: true,
          },
        },
      },
    });

    if (!ledgerAccount) {
      throw new NotFoundException('Ledger account not found.');
    }

    return ledgerAccount;
  }

  private async getParticularAccountRecord(
    companyId: string,
    particularAccountId: string,
  ) {
    await this.assertCompanyExists(companyId);

    const particularAccount = await this.prisma.particularAccount.findFirst({
      where: {
        id: particularAccountId,
        companyId,
      },
      include: {
        ledgerAccount: {
          include: {
            accountGroup: {
              include: {
                accountClass: true,
              },
            },
          },
        },
      },
    });

    if (!particularAccount) {
      throw new NotFoundException('Particular account not found.');
    }

    return particularAccount;
  }

  private normalizeCodeNameInput(input: {
    code: string;
    name: string;
    description?: string | null | undefined;
  }) {
    return {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
    };
  }

  private mapAccountClass(accountClass: AccountClassRecord): AccountClassDto {
    return {
      id: accountClass.id,
      code: accountClass.code,
      name: accountClass.name,
      naturalBalance: accountClass.naturalBalance,
      sortOrder: accountClass.sortOrder,
      isActive: accountClass.isActive,
      createdAt: accountClass.createdAt.toISOString(),
      updatedAt: accountClass.updatedAt.toISOString(),
    };
  }

  private mapAccountGroup(accountGroup: AccountGroupRecord): AccountGroupDto {
    return {
      id: accountGroup.id,
      companyId: accountGroup.companyId,
      accountClassId: accountGroup.accountClassId,
      accountClassCode: accountGroup.accountClass.code,
      accountClassName: accountGroup.accountClass.name,
      code: accountGroup.code,
      name: accountGroup.name,
      description: accountGroup.description,
      isActive: accountGroup.isActive,
      createdAt: accountGroup.createdAt.toISOString(),
      updatedAt: accountGroup.updatedAt.toISOString(),
    };
  }

  private mapLedgerAccount(ledgerAccount: LedgerAccountRecord): LedgerAccountDto {
    return {
      id: ledgerAccount.id,
      companyId: ledgerAccount.companyId,
      accountClassId: ledgerAccount.accountGroup.accountClassId,
      accountClassCode: ledgerAccount.accountGroup.accountClass.code,
      accountClassName: ledgerAccount.accountGroup.accountClass.name,
      accountGroupId: ledgerAccount.accountGroupId,
      accountGroupCode: ledgerAccount.accountGroup.code,
      accountGroupName: ledgerAccount.accountGroup.name,
      code: ledgerAccount.code,
      name: ledgerAccount.name,
      description: ledgerAccount.description,
      isActive: ledgerAccount.isActive,
      createdAt: ledgerAccount.createdAt.toISOString(),
      updatedAt: ledgerAccount.updatedAt.toISOString(),
    };
  }

  private mapParticularAccount(
    particularAccount: ParticularAccountRecord,
  ): ParticularAccountDto {
    return {
      id: particularAccount.id,
      companyId: particularAccount.companyId,
      accountClassId:
        particularAccount.ledgerAccount.accountGroup.accountClassId,
      accountClassCode:
        particularAccount.ledgerAccount.accountGroup.accountClass.code,
      accountClassName:
        particularAccount.ledgerAccount.accountGroup.accountClass.name,
      accountGroupId: particularAccount.ledgerAccount.accountGroupId,
      accountGroupCode: particularAccount.ledgerAccount.accountGroup.code,
      accountGroupName: particularAccount.ledgerAccount.accountGroup.name,
      ledgerAccountId: particularAccount.ledgerAccountId,
      ledgerAccountCode: particularAccount.ledgerAccount.code,
      ledgerAccountName: particularAccount.ledgerAccount.name,
      code: particularAccount.code,
      name: particularAccount.name,
      description: particularAccount.description,
      isActive: particularAccount.isActive,
      createdAt: particularAccount.createdAt.toISOString(),
      updatedAt: particularAccount.updatedAt.toISOString(),
    };
  }
}
