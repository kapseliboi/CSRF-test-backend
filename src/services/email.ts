import * as R from 'ramda';
import { messages, Mailgun, Error as MailgunError } from 'mailgun-js';
import config from '../config';
import { User } from '../entity/User';
import { createEmailValidationToken } from '../util/authentication';

let mailService: Mailgun | Partial<Mailgun>;
if (!R.isNil(config.MAILGUN_API_KEY)) {
    import('mailgun-js').then((mailgun) => {
        mailService = mailgun({
            apiKey: config.MAILGUN_API_KEY,
            domain: config.MAILGUN_DOMAIN,
        });
    });
}
else {
    mailService = {
        messages: () => ({
            send: async (
                data: messages.SendData | messages.BatchData | messages.SendTemplateData,
                callback?: (error: MailgunError, body: messages.SendResponse) => void
            ): Promise<messages.SendResponse> => {
                return { message: JSON.stringify(data, null, 2), id: 'MOCK' };
            }
        }),
    };
}

const NOREPLY_EMAIL = `noreply@${config.MAILGUN_DOMAIN}`;

async function sendEmail(from: string, to: string, subject: string, html?: string, text?: string) {
    const { message } = await mailService.messages().send({
        from,
        to,
        subject,
        html,
        text,
    });
    console.log(message);
}

export async function sendRegistrationEmail(user: User) {
    const subject = 'Complete your registration at CSRFTest';
    const text = `Hello ${user.username}!\nComplete your registration by clicking the link below:\n`
        + `${config.FRONTEND_URL}/api/verify-email/${user.id}/${encodeURIComponent(await createEmailValidationToken(user))}`;
    await sendEmail(NOREPLY_EMAIL, user.email, subject, undefined, text);
}

export async function sendEmailAlreadyRegisteredEmail(user: User) {
    const subject = 'Registration at CSRFTest';
    const text = `Hello ${user.username}!\nYou (or someone else) tried to register a new account using`
        + ` this email address which is already in use by the username ${user.username}.`;
    await sendEmail(NOREPLY_EMAIL, user.email, subject, undefined, text);
}

export async function sendAccountDisabled(user: User) {
    const subject = 'Your account at CSRFTest';
    const text = `Hello ${user.username}!\nYour account is disabled and there's nothing we can do about it.`;
    await sendEmail(NOREPLY_EMAIL, user.email, subject, undefined, text);
}
