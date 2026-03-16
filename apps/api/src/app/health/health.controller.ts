import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  HealthLivenessResponseDto,
  HealthReadinessResponseDto,
} from './dto/health-response.dto';
import type {
  HealthLivenessResponse,
  HealthReadinessResponse,
} from './health.types';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe for the API process.' })
  @ApiOkResponse({
    description: 'API runtime is alive.',
    type: HealthLivenessResponseDto,
  })
  getLiveness(): HealthLivenessResponse {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe for the API runtime and infrastructure dependencies.',
  })
  @ApiOkResponse({
    description: 'API runtime and dependencies are ready.',
    type: HealthReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'One or more infrastructure dependencies are unavailable.',
    type: HealthReadinessResponseDto,
  })
  async getReadiness(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthReadinessResponse> {
    const readiness = await this.healthService.getReadiness();

    response.status(
      readiness.status === 'ok'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return readiness;
  }

  @Get('dependencies')
  @ApiOperation({
    summary: 'Structured dependency report for runtime, PostgreSQL, and S3-compatible storage.',
  })
  @ApiOkResponse({
    description: 'All dependencies are available.',
    type: HealthReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'At least one dependency is unavailable.',
    type: HealthReadinessResponseDto,
  })
  async getDependencies(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthReadinessResponse> {
    const dependencies = await this.healthService.getDependencies();

    response.status(
      dependencies.status === 'ok'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return dependencies;
  }
}
