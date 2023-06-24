import {
    IsNotEmpty,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class PromptDto {
    @IsNotEmpty()
    @ApiProperty()
    prompt!: string;
}
