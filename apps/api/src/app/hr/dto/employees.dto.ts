import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ActiveFilterQueryDto } from '../../common/dto/active-filter-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { trimToUndefined } from '../../common/utils/dto-transformers';

export class EmployeesListQueryDto extends ActiveFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;
}

export class CreateEmployeeDto {
  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode!: string;

  @ApiProperty()
  @trimToUndefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string | null;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode?: string;

  @ApiPropertyOptional()
  @trimToUndefined()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string | null;
}

export class EmployeeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  departmentName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  locationName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  userId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  userEmail!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  userFirstName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  userLastName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  managerEmployeeId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  managerEmployeeCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  managerFullName!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class EmployeesListResponseDto {
  @ApiProperty({
    type: () => [EmployeeDto],
  })
  items!: EmployeeDto[];

  @ApiProperty({
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
