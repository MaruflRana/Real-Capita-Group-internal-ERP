import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { AuthCookieService } from './auth-cookie.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import type { AuthenticatedUser } from './interfaces/auth.types';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate with email and password for a company-scoped session.',
  })
  @ApiOkResponse({
    description: 'Authentication succeeded and access/refresh tokens were issued.',
    type: AuthSessionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or company selection is required.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication failed.',
    type: ApiErrorResponseDto,
  })
  async login(
    @RequestId() requestId: string | undefined,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(loginDto, requestId);

    this.authCookieService.setSessionCookies(response, session);

    return session;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new company-scoped access token.',
  })
  @ApiOkResponse({
    description: 'Token rotation succeeded.',
    type: AuthSessionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token verification failed.',
    type: ApiErrorResponseDto,
  })
  async refresh(
    @RequestId() requestId: string | undefined,
    @Body() refreshDto: RefreshSessionDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      refreshDto.refreshToken ?? this.authCookieService.readRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const session = await this.authService.refresh({ refreshToken }, requestId);

    this.authCookieService.setSessionCookies(response, session);

    return session;
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Revoke the refresh token family for the current session.',
  })
  @ApiOkResponse({
    description: 'The refresh token family was revoked.',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token verification failed.',
    type: ApiErrorResponseDto,
  })
  async logout(
    @RequestId() requestId: string | undefined,
    @Body() logoutDto: LogoutDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      logoutDto.refreshToken ?? this.authCookieService.readRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const logoutResponse = await this.authService.logout(
      { refreshToken },
      requestId,
    );

    this.authCookieService.clearSessionCookies(response);

    return logoutResponse;
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the authenticated user profile for the current company context.',
  })
  @ApiOkResponse({
    description: 'Current authenticated user profile.',
    type: CurrentUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  getCurrentUser(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.authService.getCurrentUserProfile(authenticatedUser);
  }
}
