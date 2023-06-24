import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @IsNotEmpty()
  @ApiProperty()
  role!: string;

  @IsNotEmpty()
  @ApiProperty()
  content!: string;

  static fromArray(array: any[]): MessageDto[] {
    return array.map(item => {
      const messageDto = new MessageDto();
      messageDto.role = item.role;
      messageDto.content = item.content;
      return messageDto;
    });
  }
}
