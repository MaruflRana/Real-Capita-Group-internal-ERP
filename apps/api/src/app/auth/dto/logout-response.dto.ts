import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    enum: ['ok'],
  })
  status!: 'ok';

  @ApiProperty()
  message!: string;
}
