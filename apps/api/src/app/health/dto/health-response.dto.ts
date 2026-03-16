import { ApiProperty } from '@nestjs/swagger';

class HealthDependencyCheckDto {
  @ApiProperty({
    enum: ['ok', 'error'],
  })
  status!: 'ok' | 'error';

  @ApiProperty({
    description: 'Infrastructure target being checked.',
  })
  target!: string;

  @ApiProperty({
    description: 'Operator-facing summary for the current check result.',
  })
  summary!: string;

  @ApiProperty({
    description: 'Latency of the dependency check in milliseconds.',
    required: false,
  })
  latencyMs?: number;
}

class LivenessChecksDto {
  @ApiProperty({
    type: () => HealthDependencyCheckDto,
  })
  runtime!: HealthDependencyCheckDto;
}

class ReadinessChecksDto extends LivenessChecksDto {
  @ApiProperty({
    type: () => HealthDependencyCheckDto,
  })
  database!: HealthDependencyCheckDto;

  @ApiProperty({
    type: () => HealthDependencyCheckDto,
  })
  storage!: HealthDependencyCheckDto;
}

export class HealthLivenessResponseDto {
  @ApiProperty({
    enum: ['ok'],
  })
  status!: 'ok';

  @ApiProperty()
  service!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({
    type: () => LivenessChecksDto,
  })
  checks!: LivenessChecksDto;
}

export class HealthReadinessResponseDto {
  @ApiProperty({
    enum: ['ok', 'error'],
  })
  status!: 'ok' | 'error';

  @ApiProperty()
  service!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({
    type: () => ReadinessChecksDto,
  })
  checks!: ReadinessChecksDto;
}
