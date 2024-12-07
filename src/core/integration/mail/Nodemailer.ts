import { mailAddress, mailPrivateKey } from '@config';
import Logger from '@core/Logger';
import nodemailer from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

const transporter = nodemailer.createTransport({
  service: 'Outlook365',
  auth: {
    user: mailAddress,
    pass: mailPrivateKey,
  },
});

/**
 *
 * @param to Comma separated list or an array of recipients e-mail addresses that will appear on the To: field
 * @param subject The subject of the e-mail
 * @param text The plaintext version of the message
 */
export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  bcc?: string[],
  attachments?: Attachment[],
) => {
  try {
    await transporter.verify();
    await transporter.sendMail({
      from: 'eloheaven <admin@eloheaven.gg>',
      to,
      subject,
      text,
      bcc,
      attachments,
    });
  } catch (err) {
    Logger.info('🚫 Something went wrong while sending mail (sendMail).');
    Logger.error(err);
  }
};

/**
 *
 * @param to Comma separated list or an array of recipients e-mail addresses that will appear on the To: field
 * @param subject The subject of the e-mail
 * @param html The HTML version of the message
 */
export const sendMailRich = async (
  to: string,
  subject: string,
  html: string,
  bcc?: string[],
  attachments?: Attachment[],
) => {
  try {
    await transporter.verify();
    await transporter.sendMail({
      from: 'eloheaven <admin@eloheaven.gg>',
      to,
      subject,
      html,
      bcc,
      attachments,
    });
  } catch (err) {
    Logger.info('🚫 Something went wrong while sending mail (sendMailRich).');
    Logger.error(err);
  }
};
