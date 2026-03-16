import { ApiProperty } from '@nestjs/swagger';

import { AuthCompanyDto } from './auth-company.dto';

export class AuthAssignmentDto {
  @ApiProperty({
    type: () => AuthCompanyDto,
  })
  company!: AuthCompanyDto;

  @ApiProperty({
    type: [String],
  })
  roles!: string[];
}
