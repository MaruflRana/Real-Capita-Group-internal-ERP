import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { API_VERSION } from '@real-capita/config';
import type { HealthCheckResponse } from '@real-capita/types';

import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version(API_VERSION)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'API process is healthy.' })
  getHealth(): HealthCheckResponse {
    return this.healthService.getStatus();
  }
}
