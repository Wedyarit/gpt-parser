import {
    IsNotEmpty,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ChatPromptDto {
    @ApiProperty()
    chatId?: string;

    @IsNotEmpty()
    @ApiProperty()
    prompt!: string;
}
