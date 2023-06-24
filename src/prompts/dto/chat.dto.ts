import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @IsNotEmpty()
  @ApiProperty()
  id!: string;

  @IsNotEmpty()
  @ApiProperty()
  name!: string;

  static fromArray(array: any[]): ChatDto[] {
    return array.map((item) => {
      const chatDto = new ChatDto();
      chatDto.id = item.id;
      chatDto.name = item.name;
      return chatDto;
    });
  }

  static fromObject(object: any): ChatDto {
    const chatDto = new ChatDto();
    chatDto.id = object.id;
    chatDto.name = object.name;
    return chatDto;
  }
}
