import { ApiProperty } from '@nestjs/swagger';

import { CurrentUserDto } from './current-user.dto';

export class AuthSessionResponseDto {
  @ApiProperty()
  tokenType!: string;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  accessTokenExpiresAt!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  refreshTokenExpiresAt!: string;

  @ApiProperty({
    type: () => CurrentUserDto,
  })
  user!: CurrentUserDto;
}
