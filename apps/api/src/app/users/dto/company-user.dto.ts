import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  firstName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  lastName!: string | null;

  @ApiProperty({
    description: 'Global identity status for the user record.',
  })
  identityIsActive!: boolean;

  @ApiProperty({
    description: 'Whether the user has any active role assignments in the scoped company.',
  })
  companyAccessIsActive!: boolean;

  @ApiProperty({
    type: [String],
  })
  roles!: string[];

  @ApiPropertyOptional({
    nullable: true,
  })
  lastLoginAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
