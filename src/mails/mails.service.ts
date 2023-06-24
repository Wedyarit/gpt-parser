const Imap = require('imap');
const { simpleParser } = require('mailparser');

export class MailsService {
  imapConfig = {
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    tls: true,
  };

  constructor() {}

  getEmails(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const imap = new Imap(this.imapConfig);

        imap.once('ready', () => {
          imap.openBox('INBOX', false, () => {
            const searchEmails = () => {
              imap.search(
                ['UNSEEN', ['FROM', 'notifications@forefront.ai']],
                (err, results) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  if (results.length === 0) {
                    // No unseen emails found, wait for 5 seconds and search again
                    setTimeout(searchEmails, 5000);
                    return;
                  }

                  const f = imap.fetch(results, { bodies: '' });
                  f.on('message', (msg) => {
                    msg.on('body', (stream) => {
                      simpleParser(stream, async (err, parsed) => {
                        const code = parsed['text'].substring(0, 6);
                        console.log('Successfully logged in!');
                        resolve(code);
                      });
                    });
                    msg.once('attributes', (attrs) => {
                      const { uid } = attrs;
                      imap.addFlags(uid, ['Deleted'], () => {});
                    });
                  });
                  f.once('error', (ex) => {
                    reject(ex);
                  });
                  f.once('end', () => {
                    imap.end();
                  });
                },
              );
            };

            searchEmails();
          });
        });

        imap.once('error', (err) => {
          reject(err);
        });

        imap.connect();
      } catch (ex) {
        reject(ex);
      }
    });
  }
}
