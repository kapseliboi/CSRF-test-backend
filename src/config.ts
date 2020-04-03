import * as R from 'ramda';

function mandatoryEnv(name: string) {
    const value = process.env[name];
    if (R.isNil(value) || R.isEmpty(value)) {
        console.log(`Mandatory environment variable ${name} doesn't have a value!`);
        process.exit(1);
    } else {
        return value;
    }
}

function optionalEnv(name: string) {
    return process.env[name];
}

function stringToBool(value: string): boolean {
    return value === 'true';
}

export default {
    NODE_ENV: optionalEnv('NODE_ENV'),
    JWT_SECRET_KEY: mandatoryEnv('JWT_SECRET_KEY'),
    EMAIL_TOKEN_SECRET_KEY: mandatoryEnv('EMAIL_TOKEN_SECRET_KEY'),
    FRONTEND_URL: mandatoryEnv('FRONTEND_URL'),
    HTTPS_ONLY: stringToBool(optionalEnv('HTTPS_ONLY')),
    PORT: optionalEnv('PORT') || 8080,
    DATABASE_URL: mandatoryEnv('DATABASE_URL'),
    // Mailgun config, required for sending email
    MAILGUN_API_KEY: optionalEnv('MAILGUN_API_KEY'),
    MAILGUN_DOMAIN: optionalEnv('MAILGUN_DOMAIN'),
    MAILGUN_PUBLIC_KEY: optionalEnv('MAILGUN_PUBLIC_KEY'),
    MAILGUN_SMTP_LOGIN: optionalEnv('MAILGUN_SMTP_LOGIN'),
    MAILGUN_SMTP_PASSWORD: optionalEnv('MAILGUN_SMTP_PASSWORD'),
    MAILGUN_SMTP_PORT: optionalEnv('MAILGUN_SMTP_PORT'),
    MAILGUN_SMTP_SERVER: optionalEnv('MAILGUN_SMTP_SERVER')
};
