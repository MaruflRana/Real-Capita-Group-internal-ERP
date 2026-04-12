import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { DatabaseService } from '../database/database.service';
import { AuthRepository, type UserRoleWithRelationsRecord } from './auth.repository';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import type {
  AccessTokenPayload,
  AuthProfile,
  AuthenticatedUser,
  CompanyAssignment,
} from './interfaces/auth.types';
import { AuthTokenService } from './auth-token.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly passwordService: PasswordService,
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, requestId?: string) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.passwordService.verifyPassword(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const assignments = this.buildAssignments(user.userRoles);
    const companyId = this.resolveCompanyId(assignments, loginDto.companyId);
    const currentAssignment = assignments.find(
      (assignment) => assignment.companyId === companyId,
    );

    if (!currentAssignment) {
      throw new UnauthorizedException(
        'The selected company is not available for this user.',
      );
    }

    const authenticatedUser = this.buildAuthenticatedUser(user.id, user.email, currentAssignment);
    const tokenSet = await this.authTokenService.issueTokenSet(authenticatedUser);

    await this.databaseService.withTransaction(async (transaction) => {
      await this.authRepository.createRefreshToken(
        {
          userId: user.id,
          companyId,
          tokenId: tokenSet.refreshTokenId,
          familyId: tokenSet.familyId,
          tokenHash: this.authTokenService.hashToken(tokenSet.refreshToken),
          expiresAt: tokenSet.refreshTokenExpiresAt,
        },
        transaction,
      );
      await this.authRepository.updateUserLastLogin(user.id, transaction);
      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: user.id,
          category: 'AUTH',
          eventType: AUDIT_EVENT_TYPES.authLoginSucceeded,
          targetEntityType: 'USER',
          targetEntityId: user.id,
          requestId,
          metadata: {
            roles: currentAssignment.roles,
          },
        },
        transaction,
      );
    });

    const profile = await this.getCurrentUserProfile(authenticatedUser);

    return this.buildSessionResponse(profile, tokenSet);
  }

  async refresh(refreshDto: RefreshSessionDto, requestId?: string) {
    if (!refreshDto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const refreshPayload = await this.authTokenService.verifyRefreshToken(
      refreshDto.refreshToken,
    );

    if (!refreshPayload.jti) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const storedRefreshToken =
      await this.authRepository.findRefreshTokenByTokenId(refreshPayload.jti);

    if (
      !storedRefreshToken ||
      storedRefreshToken.userId !== refreshPayload.sub ||
      storedRefreshToken.companyId !== refreshPayload.companyId ||
      storedRefreshToken.familyId !== refreshPayload.familyId
    ) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    if (storedRefreshToken.revokedAt) {
      await this.databaseService.withTransaction(async (transaction) => {
        await this.authRepository.revokeRefreshTokenFamily(
          storedRefreshToken.familyId,
          'Detected refresh token reuse.',
          transaction,
        );
      });

      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    if (
      !this.authTokenService.matchesTokenHash(
        refreshDto.refreshToken,
        storedRefreshToken.tokenHash,
      )
    ) {
      await this.databaseService.withTransaction(async (transaction) => {
        await this.authRepository.revokeRefreshTokenFamily(
          storedRefreshToken.familyId,
          'Detected refresh token hash mismatch.',
          transaction,
        );
      });

      throw new UnauthorizedException('Refresh token is invalid.');
    }

    if (storedRefreshToken.expiresAt <= new Date()) {
      await this.databaseService.withTransaction(async (transaction) => {
        await this.authRepository.revokeRefreshTokenFamily(
          storedRefreshToken.familyId,
          'Refresh token expired.',
          transaction,
        );
      });

      throw new UnauthorizedException('Refresh token has expired.');
    }

    const accessContext = await this.authRepository.findUserCompanyAccess(
      storedRefreshToken.userId,
      storedRefreshToken.companyId,
    );

    if (!accessContext) {
      await this.databaseService.withTransaction(async (transaction) => {
        await this.authRepository.revokeRefreshTokenFamily(
          storedRefreshToken.familyId,
          'User access context is no longer active.',
          transaction,
        );
      });

      throw new UnauthorizedException(
        'User access context is no longer active.',
      );
    }

    const authenticatedUser = this.mapAccessContextToAuthenticatedUser(
      accessContext,
    );
    const tokenSet = await this.authTokenService.issueTokenSet(
      authenticatedUser,
      storedRefreshToken.familyId,
    );

    await this.databaseService.withTransaction(async (transaction) => {
      await this.authRepository.markRefreshTokenRotated(
        storedRefreshToken.id,
        tokenSet.refreshTokenId,
        transaction,
      );
      await this.authRepository.createRefreshToken(
        {
          userId: authenticatedUser.id,
          companyId: authenticatedUser.companyId,
          tokenId: tokenSet.refreshTokenId,
          familyId: tokenSet.familyId,
          tokenHash: this.authTokenService.hashToken(tokenSet.refreshToken),
          parentTokenId: storedRefreshToken.tokenId,
          expiresAt: tokenSet.refreshTokenExpiresAt,
        },
        transaction,
      );
      await this.auditService.recordEvent(
        {
          companyId: authenticatedUser.companyId,
          actorUserId: authenticatedUser.id,
          category: 'AUTH',
          eventType: AUDIT_EVENT_TYPES.authSessionRefreshed,
          targetEntityType: 'USER',
          targetEntityId: authenticatedUser.id,
          requestId,
          metadata: {
            roles: authenticatedUser.roles,
          },
        },
        transaction,
      );
    });

    const profile = await this.getCurrentUserProfile(authenticatedUser);

    return this.buildSessionResponse(profile, tokenSet);
  }

  async logout(logoutDto: LogoutDto, requestId?: string) {
    if (!logoutDto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const refreshPayload = await this.authTokenService.verifyRefreshToken(
      logoutDto.refreshToken,
    );

    if (!refreshPayload.jti) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const storedRefreshToken =
      await this.authRepository.findRefreshTokenByTokenId(refreshPayload.jti);

    if (storedRefreshToken) {
      await this.databaseService.withTransaction(async (transaction) => {
        await this.authRepository.revokeRefreshTokenFamily(
          storedRefreshToken.familyId,
          'User requested logout.',
          transaction,
        );
        await this.auditService.recordEvent(
          {
            companyId: storedRefreshToken.companyId,
            actorUserId: storedRefreshToken.userId,
            category: 'AUTH',
            eventType: AUDIT_EVENT_TYPES.authSessionLoggedOut,
            targetEntityType: 'USER',
            targetEntityId: storedRefreshToken.userId,
            requestId,
          },
          transaction,
        );
      });
    }

    return {
      status: 'ok' as const,
      message: 'Session revoked.',
    };
  }

  async getCurrentUserProfile(
    authenticatedUser: AuthenticatedUser,
  ): Promise<AuthProfile> {
    const user = await this.authRepository.findUserById(authenticatedUser.id);

    if (!user?.isActive) {
      throw new UnauthorizedException('User is no longer active.');
    }

    const assignments = this.buildAssignments(user.userRoles);
    const currentAssignment = assignments.find(
      (assignment) => assignment.companyId === authenticatedUser.companyId,
    );

    if (!currentAssignment) {
      throw new UnauthorizedException(
        'The authenticated company context is no longer active.',
      );
    }

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      currentCompany: {
        id: currentAssignment.companyId,
        name: currentAssignment.companyName,
        slug: currentAssignment.companySlug,
      },
      roles: currentAssignment.roles,
      assignments: assignments.map((assignment) => ({
        company: {
          id: assignment.companyId,
          name: assignment.companyName,
          slug: assignment.companySlug,
        },
        roles: assignment.roles,
      })),
    };
  }

  async validateAccessTokenPayload(
    payload: AccessTokenPayload,
  ): Promise<AuthenticatedUser> {
    const accessContext = await this.authRepository.findUserCompanyAccess(
      payload.sub,
      payload.companyId,
    );

    if (!accessContext) {
      throw new UnauthorizedException('Access token is no longer valid.');
    }

    return this.mapAccessContextToAuthenticatedUser(accessContext);
  }

  private buildAssignments(
    userRoles: Array<{
      company: {
        id: string;
        name: string;
        slug: string;
      };
      role: {
        code: string;
      };
    }>,
  ): CompanyAssignment[] {
    const assignmentsByCompany = new Map<string, CompanyAssignment>();

    for (const userRole of userRoles) {
      const existingAssignment = assignmentsByCompany.get(userRole.company.id);

      if (!existingAssignment) {
        assignmentsByCompany.set(userRole.company.id, {
          companyId: userRole.company.id,
          companyName: userRole.company.name,
          companySlug: userRole.company.slug,
          roles: [userRole.role.code],
        });

        continue;
      }

      if (!existingAssignment.roles.includes(userRole.role.code)) {
        existingAssignment.roles.push(userRole.role.code);
      }
    }

    return Array.from(assignmentsByCompany.values()).sort((left, right) =>
      left.companySlug.localeCompare(right.companySlug),
    );
  }

  private resolveCompanyId(
    assignments: CompanyAssignment[],
    requestedCompanyId?: string,
  ): string {
    if (assignments.length === 0) {
      throw new UnauthorizedException(
        'No active company role assignments are available for this user.',
      );
    }

    if (requestedCompanyId) {
      const assignment = assignments.find(
        (currentAssignment) => currentAssignment.companyId === requestedCompanyId,
      );

      if (!assignment) {
        throw new UnauthorizedException(
          'The selected company is not available for this user.',
        );
      }

      return assignment.companyId;
    }

    if (assignments.length > 1) {
      throw new BadRequestException(
        {
          error: 'Bad Request',
          message:
            'companyId is required when multiple active company memberships exist.',
          details: {
            availableCompanies: assignments.map((assignment) => ({
              id: assignment.companyId,
              name: assignment.companyName,
              slug: assignment.companySlug,
              roles: assignment.roles,
            })),
          },
        },
      );
    }

    const [assignment] = assignments;

    if (!assignment) {
      throw new UnauthorizedException(
        'No active company role assignments are available for this user.',
      );
    }

    return assignment.companyId;
  }

  private buildAuthenticatedUser(
    userId: string,
    email: string,
    assignment: CompanyAssignment,
  ): AuthenticatedUser {
    return {
      id: userId,
      email,
      companyId: assignment.companyId,
      companyName: assignment.companyName,
      companySlug: assignment.companySlug,
      roles: assignment.roles,
    };
  }

  private mapAccessContextToAuthenticatedUser(
    accessContext: UserRoleWithRelationsRecord[],
  ): AuthenticatedUser {
    const [firstAssignment] = accessContext;

    if (!firstAssignment) {
      throw new UnauthorizedException('Access token is no longer valid.');
    }

    const roles = Array.from(
      new Set(accessContext.map((assignment) => assignment.role.code)),
    ).sort();

    return {
      id: firstAssignment.user.id,
      email: firstAssignment.user.email,
      companyId: firstAssignment.company.id,
      companyName: firstAssignment.company.name,
      companySlug: firstAssignment.company.slug,
      roles,
    };
  }

  private buildSessionResponse(
    profile: AuthProfile,
    tokenSet: {
      accessToken: string;
      accessTokenExpiresAt: Date;
      refreshToken: string;
      refreshTokenExpiresAt: Date;
    },
  ) {
    return {
      tokenType: 'Bearer',
      accessToken: tokenSet.accessToken,
      accessTokenExpiresAt: tokenSet.accessTokenExpiresAt.toISOString(),
      refreshToken: tokenSet.refreshToken,
      refreshTokenExpiresAt: tokenSet.refreshTokenExpiresAt.toISOString(),
      user: {
        id: profile.id,
        email: profile.email,
        isActive: profile.isActive,
        lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
        currentCompany: {
          id: profile.currentCompany.id,
          name: profile.currentCompany.name,
          slug: profile.currentCompany.slug,
        },
        roles: profile.roles,
        assignments: profile.assignments,
      },
    };
  }
}
