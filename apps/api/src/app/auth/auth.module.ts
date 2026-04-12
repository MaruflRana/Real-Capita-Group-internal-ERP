import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DatabaseModule } from '../database/database.module';
import { AuthBootstrapService } from './auth-bootstrap.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { PasswordService } from './password.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CompanyAssignmentGuard } from './guards/company-assignment.guard';
import { CompanyScopeGuard } from './guards/company-scope.guard';
import { RolesGuard } from './guards/roles.guard';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthBootstrapService,
    AuthCookieService,
    AuthRepository,
    AuthService,
    AuthTokenService,
    PasswordService,
    AccessTokenGuard,
    CompanyAssignmentGuard,
    RolesGuard,
    CompanyScopeGuard,
    AccessTokenStrategy,
  ],
  exports: [
    AuthBootstrapService,
    AuthService,
    AuthCookieService,
    AuthRepository,
    PasswordService,
    AccessTokenGuard,
    CompanyAssignmentGuard,
    RolesGuard,
    CompanyScopeGuard,
  ],
})
export class AuthModule {}
