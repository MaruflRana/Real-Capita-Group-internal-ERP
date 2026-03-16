import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';

import { DatabaseService } from '../database/database.service';
import { BOOTSTRAP_ROLE_DEFINITIONS, ROLE_COMPANY_ADMIN } from './constants/auth.constants';
import type {
  BootstrapAdminInput,
  BootstrapAdminResult,
} from './interfaces/auth.types';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './password.service';

@Injectable()
export class AuthBootstrapService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly databaseService: DatabaseService,
  ) {}

  async bootstrapAdmin(
    input: BootstrapAdminInput,
  ): Promise<BootstrapAdminResult> {
    const normalizedCompanyName = input.companyName.trim();
    const normalizedCompanySlug = input.companySlug.trim().toLowerCase();
    const normalizedAdminEmail = input.adminEmail.trim().toLowerCase();

    this.validateBootstrapInput(
      normalizedCompanyName,
      normalizedCompanySlug,
      normalizedAdminEmail,
      input.adminPassword,
    );

    const passwordHash = await this.passwordService.hashPassword(
      input.adminPassword,
    );

    return this.databaseService.withTransaction(async (transaction) => {
      const existingCompany = await this.authRepository.findCompanyBySlug(
        normalizedCompanySlug,
        transaction,
      );

      if (existingCompany && !existingCompany.isActive) {
        throw new BadRequestException(
          'The target company exists but is inactive.',
        );
      }

      const company = existingCompany
        ? normalizedCompanyName !== existingCompany.name
          ? await this.authRepository.updateCompanyName(
              existingCompany.id,
              normalizedCompanyName,
              transaction,
            )
          : existingCompany
        : await this.authRepository.createCompany(
            normalizedCompanyName,
            normalizedCompanySlug,
            transaction,
          );
      const ensuredRoles: string[] = [];

      for (const roleDefinition of BOOTSTRAP_ROLE_DEFINITIONS) {
        await this.authRepository.upsertRole(roleDefinition, transaction);
        ensuredRoles.push(roleDefinition.code);
      }

      const adminRole = await this.authRepository.findRoleByCode(
        ROLE_COMPANY_ADMIN,
        transaction,
      );

      if (!adminRole) {
        throw new BadRequestException(
          'The company admin role could not be resolved during bootstrap.',
        );
      }

      const existingUser = await this.authRepository.findAnyUserByEmail(
        normalizedAdminEmail,
        transaction,
      );

      if (existingUser && !existingUser.isActive) {
        throw new BadRequestException(
          'The admin email is already assigned to an inactive user.',
        );
      }

      const adminUser =
        existingUser ??
        (await this.authRepository.createUser(
          normalizedAdminEmail,
          passwordHash,
          transaction,
        ));
      const existingAdminAssignment =
        await this.authRepository.findUserRoleAssignment(
          adminUser.id,
          company.id,
          adminRole.id,
          transaction,
        );

      await this.authRepository.ensureUserRole(
        adminUser.id,
        company.id,
        adminRole.id,
        transaction,
      );

      return {
        companyId: company.id,
        adminUserId: adminUser.id,
        createdCompany: !existingCompany,
        createdUser: !existingUser,
        reusedExistingUser: Boolean(existingUser),
        attachedAdminRole: !existingAdminAssignment,
        ensuredRoles,
      };
    });
  }

  private validateBootstrapInput(
    companyName: string,
    companySlug: string,
    adminEmail: string,
    adminPassword: string,
  ): void {
    if (!companyName) {
      throw new BadRequestException('companyName must not be empty.');
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(companySlug)) {
      throw new BadRequestException(
        'companySlug must contain only lowercase letters, numbers, and hyphens.',
      );
    }

    if (!isEmail(adminEmail)) {
      throw new BadRequestException('adminEmail must be a valid email address.');
    }

    if (adminPassword.length < 12) {
      throw new BadRequestException(
        'adminPassword must be at least 12 characters long.',
      );
    }
  }
}
