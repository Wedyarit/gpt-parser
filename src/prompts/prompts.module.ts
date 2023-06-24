import { Module } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { PuppeteerProvider } from '../puppeteer/puppeteer.provider';
import { MailsModule } from '../mails/mails.module';
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule, MailsModule],
  controllers: [PromptsController],
  providers: [PromptsService, PuppeteerProvider],
  exports: [],
})
export class PromptsModule {}
