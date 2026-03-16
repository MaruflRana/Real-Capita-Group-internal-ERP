import { ApiProperty } from '@nestjs/swagger';

export class AuthCompanyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}
