import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Optional when a refresh-token cookie is present. Existing API callers may still provide it in the request body.',
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  refreshToken?: string;
}
