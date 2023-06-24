import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { MailsService } from '../mails/mails.service';

@Injectable()
export class PuppeteerProvider implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;

  constructor(
    @Inject(MailsService) private readonly mailsService: MailsService,
  ) {}

  async onModuleInit() {
    this.browser = await puppeteer.launch({ headless: "new" });
    const page = await this.browser.newPage();

    await page.goto('https://accounts.forefront.ai/sign-in');
    await page.waitForSelector('#identifier-field');
    await page.focus('#identifier-field');
    await page.keyboard.type(process.env.MAIL_USER);

    await Promise.all([
      page.waitForNavigation(),
      page.click(
        '#__next > div > div > div > div > div.cl-main.🔒️.cl-internal-xk295g > form > button.cl-formButtonPrimary.🔒️.cl-internal-jyivd3',
      ),
    ]);

    await page.waitForSelector(
      '#__next > div > div > div > div > div.cl-main.🔒️.cl-internal-xk295g > div > div > div > input:nth-child(1)',
    );
    await page.focus(
      '#__next > div > div > div > div > div.cl-main.🔒️.cl-internal-xk295g > div > div > div > input:nth-child(1)',
    );
    await page.keyboard.type(await this.mailsService.getEmails());

    await page.evaluate(() => {
      localStorage.setItem('autosave', 'always');
    });
  }

  async onModuleDestroy() {
    await this.browser.close();
  }

  getBrowserInstance(): Browser {
    return this.browser;
  }
}
