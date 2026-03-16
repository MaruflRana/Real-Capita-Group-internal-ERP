import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty()
  statusCode!: number;

  @ApiProperty()
  error!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
  })
  requestId?: string | null;

  @ApiPropertyOptional({
    description: 'Additional error details when available.',
    type: Object,
  })
  details?: unknown;
}
