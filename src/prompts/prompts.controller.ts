import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { MessageDto } from './dto/message.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatPromptDto } from './dto/chat-prompt.dto';
import { ChatDto } from './dto/chat.dto';
import { PromptDto } from './dto/prompt.dto';

@ApiTags('prompt')
@ApiBearerAuth()
@Controller()
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @ApiOperation({
    summary: 'Send prompt (Create new or continue existing chat)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('prompt')
  async sendPrompt(@Body() promptDto: PromptDto) {
    return MessageDto.fromArray(
      await this.promptsService.sendPrompt(promptDto),
    );
  }

  @ApiOperation({
    summary: 'Send prompt (Create new or continue existing chat)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('chat-prompt')
  async sendChatPrompt(@Body() chatPromptDto: ChatPromptDto) {
    if (chatPromptDto.chatId)
      return MessageDto.fromArray(
        await this.promptsService.continueChat(chatPromptDto),
      );
    return MessageDto.fromArray(
      await this.promptsService.newChat(chatPromptDto),
    );
  }

  @ApiOperation({ summary: 'Get chats' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ChatDto],
  })
  @HttpCode(HttpStatus.OK)
  @Get('chats')
  async getChats() {
    return this.promptsService.getChats();
  }

  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [MessageDto],
  })
  @HttpCode(HttpStatus.OK)
  @Get('messages')
  async getChatMessages(@Query('chatId') chatId: string) {
    return MessageDto.fromArray(
      await this.promptsService.getChatMessages(chatId),
    );
  }
}
