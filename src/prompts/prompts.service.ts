import { ChatPromptDto } from './dto/chat-prompt.dto';
import { PuppeteerProvider } from '../puppeteer/puppeteer.provider';
import { Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatDto } from './dto/chat.dto';
import { PromptDto } from './dto/prompt.dto';

export class PromptsService {
  constructor(
    @Inject(PuppeteerProvider)
    private readonly puppeteerProvider: PuppeteerProvider,
    private readonly httpService: HttpService,
  ) {}

  async getToken() {
    const browser = this.puppeteerProvider.getBrowserInstance();
    const page = await browser.newPage();

    try {
      await page.goto('https://chat.forefront.ai/');
      const [cookie] = await page.cookies();
      return cookie.value;
    } catch (error) {
      throw error;
    } finally {
      await page.close();
    }
  }

  generateRandomString(length) {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }

    return result;
  }

  async sendPrompt(promptDto: PromptDto) {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `https://gptgod.site/api/session/free/gpt3p5?content=${
          promptDto.prompt
        }&id=${this.generateRandomString(20)}`,
      ),
    );
    return [
      {
        role: 'user',
        content: promptDto.prompt,
      },
      {
        role: 'assistant',
        content: data
          .split('\n\n')
          .filter((event) => event.startsWith('event: data'))
          .map((event) => event.split('data: ')[1].replace(/"/g, ''))
          .join(''),
      },
    ];
  }

  async newChat(promptDto: ChatPromptDto) {
    const browser = this.puppeteerProvider.getBrowserInstance();
    const page = await browser.newPage();
    await page.goto('https://chat.forefront.ai/');

    await page.evaluate(() => {
      localStorage.setItem('autosave', 'always');
    });

    await page.waitForSelector(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.relative.w-full.h-full.flex.flex-col.overflow-y-scroll.overflow-x-hidden > div.sticky.bottom-0.w-full.py-6.px-6.flex.flex-col.gap-3.items-center.justify-center.z-10.bg-th-background.bg-transparent > div.flex.flex-col.gap-2.max-w-\\[616px\\].min-w-\\[288px\\].w-full > div > div.flex.flex-col.gap-3.flex-1.align-start.justify-start > div > div > div',
    );
    await page.focus(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.relative.w-full.h-full.flex.flex-col.overflow-y-scroll.overflow-x-hidden > div.sticky.bottom-0.w-full.py-6.px-6.flex.flex-col.gap-3.items-center.justify-center.z-10.bg-th-background.bg-transparent > div.flex.flex-col.gap-2.max-w-\\[616px\\].min-w-\\[288px\\].w-full > div > div.flex.flex-col.gap-3.flex-1.align-start.justify-start > div > div > div',
    );
    await page.keyboard.type(promptDto.prompt);
    await page.keyboard.press('Enter');

    function waitForXHRResponse(page): Promise<string> {
      return new Promise((resolve) => {
        page.on('response', async (response) => {
          if (
            response.url() ===
              'https://streaming.tenant-forefront-default.knative.chi.coreweave.com/chat' &&
            response.request().method() !== 'OPTIONS'
          ) {
            resolve((await response.text()).match(/"chatId":"([^"]+)"/)[1]);
          }
        });
      });
    }

    page.on('response', async (response) => {
      if (
        response.url() ===
          'https://chat-api.tenant-forefront-default.knative.chi.coreweave.com/api/trpc/chat.renameChat?batch=1' &&
        response.request().method() !== 'OPTIONS'
      ) {
        await page.close();
      }
    });

    return this.getChatMessages(await waitForXHRResponse(page));
  }

  async continueChat(promptDto: ChatPromptDto) {
    const browser = this.puppeteerProvider.getBrowserInstance();
    const page = await browser.newPage();
    await page.goto('https://chat.forefront.ai/');

    const chatName = (await this.getChatNameByID(promptDto.chatId))['name'];

    await page.waitForSelector(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.lg\\:hidden.sticky.top-0.items-center.gap-3.flex.justify-between.w-full.bg-th-background.z-\\[1\\].px-4.py-3.border-b.border-th-border-primary > svg',
    );
    await page.click(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.lg\\:hidden.sticky.top-0.items-center.gap-3.flex.justify-between.w-full.bg-th-background.z-\\[1\\].px-4.py-3.border-b.border-th-border-primary > svg',
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const paragraphs = await page.$$('p');
    for (const paragraph of paragraphs) {
      const textContent = await paragraph.evaluate((node) => node.textContent); // Get the text content of the <p> element
      if (textContent.includes(chatName)) {
        await paragraph.click();
        break;
      }
    }

    await page.evaluate(() => {
      localStorage.setItem('autosave', 'always');
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.waitForSelector(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.relative.w-full.h-full.flex.flex-col.overflow-y-scroll.overflow-x-hidden > div.sticky.bottom-0.w-full.py-6.px-6.flex.flex-col.gap-3.items-center.justify-center.z-10.bg-th-background.bg-transparent > div.flex.flex-col.gap-2.max-w-\\[616px\\].min-w-\\[288px\\].w-full',
    );
    await page.click(
      '#__next > main > div.relative.h-full.bg-th-background.flex-1.flex.flex-col.overflow-x-hidden > div.relative.w-full.h-full.flex.flex-col.overflow-y-scroll.overflow-x-hidden > div.sticky.bottom-0.w-full.py-6.px-6.flex.flex-col.gap-3.items-center.justify-center.z-10.bg-th-background.bg-transparent > div.flex.flex-col.gap-2.max-w-\\[616px\\].min-w-\\[288px\\].w-full',
    );
    await page.keyboard.type(promptDto.prompt);
    await page.keyboard.press('Enter');

    function waitForXHRResponse(page): Promise<string> {
      return new Promise((resolve) => {
        page.on('response', async (response) => {
          if (
            response.url() ===
              'https://streaming.tenant-forefront-default.knative.chi.coreweave.com/chat' &&
            response.request().method() !== 'OPTIONS'
          ) {
            await response.text();
            resolve(promptDto.chatId);
          }
        });
      });
    }

    const response = await this.getChatMessages(await waitForXHRResponse(page));
    await page.close();
    return response;
  }

  async getChats(): Promise<ChatDto[]> {
    const token = await this.getToken();
    const apiUrl =
      'https://chat-api.tenant-forefront-default.knative.chi.coreweave.com/api/trpc/workspaces.listWorkspaces,chat.loadTree?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%224%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%225%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%7D';
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const { data } = await firstValueFrom(
      this.httpService.get(apiUrl, { headers }),
    );

    const chatData = data[1].result.data.json[0].data;

    return ChatDto.fromArray(chatData);
  }

  async getChatNameByID(chatId: string): Promise<ChatDto> {
    const token = await this.getToken();
    const apiUrl =
      'https://chat-api.tenant-forefront-default.knative.chi.coreweave.com/api/trpc/workspaces.listWorkspaces,chat.loadTree?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%224%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%2C%225%22%3A%7B%22json%22%3A%7B%22workspaceId%22%3A%22437c95ec-fd32-49a2-9f0c-680bac33bde0%22%7D%7D%7D';
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const { data } = await firstValueFrom(
      this.httpService.get(apiUrl, { headers }),
    );

    const foundElement = data[1].result.data.json[0].data.find(
      (obj) => obj.id === chatId,
    );

    return ChatDto.fromObject(foundElement);
  }

  async getChatMessages(chatId: string): Promise<any> {
    const token = await this.getToken();
    const apiUrl =
      'https://chat-api.tenant-forefront-default.knative.chi.coreweave.com/api/trpc/chat.getMessagesByChatId?batch=1';
    const requestData = {
      '0': {
        json: {
          chatId: chatId,
          workspaceId: process.env.WORKSPACE_ID,
        },
      },
    };
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const { data } = await firstValueFrom(
      this.httpService.post(apiUrl, requestData, { headers }),
    );

    return data[0].result.data.json.messages;
  }
}
