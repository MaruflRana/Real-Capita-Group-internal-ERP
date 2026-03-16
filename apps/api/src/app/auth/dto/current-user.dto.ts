import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthAssignmentDto } from './auth-assignment.dto';
import { AuthCompanyDto } from './auth-company.dto';

export class CurrentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({
    nullable: true,
  })
  lastLoginAt?: string | null;

  @ApiProperty({
    type: () => AuthCompanyDto,
  })
  currentCompany!: AuthCompanyDto;

  @ApiProperty({
    type: [String],
  })
  roles!: string[];

  @ApiProperty({
    type: () => [AuthAssignmentDto],
  })
  assignments!: AuthAssignmentDto[];
}
