import * as R from 'ramda';
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions';

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

function decodeBase64(value: string) {
    return Buffer.from(value, 'base64');
}

function stringToInt(value: string): number {
    return parseInt(value, 10);
}

const HTTPS_ONLY = stringToBool(optionalEnv('HTTPS_ONLY'));

export default {
    NODE_ENV: optionalEnv('NODE_ENV'),
    JWT_SECRET_KEY: decodeBase64(mandatoryEnv('JWT_SECRET_KEY')),
    EMAIL_TOKEN_SECRET_KEY: mandatoryEnv('EMAIL_TOKEN_SECRET_KEY'),
    FRONTEND_URL: mandatoryEnv('FRONTEND_URL'),
    BACKEND_URL: mandatoryEnv('BACKEND_URL'),
    HTTPS_ONLY,
    CSRF_COOKIE_NAME: HTTPS_ONLY ? '__Host-csrf' : '_csrf',
    CSRF_HEADER_NAME: mandatoryEnv('CSRF_HEADER_NAME'),
    PORT: optionalEnv('PORT') || 8080,
    DATABASE_URL: mandatoryEnv('DATABASE_URL'),
    // Mailgun config, required for sending email
    MAILGUN_API_KEY: optionalEnv('MAILGUN_API_KEY'),
    MAILGUN_DOMAIN: mandatoryEnv('MAILGUN_DOMAIN'),
    MAILGUN_PUBLIC_KEY: optionalEnv('MAILGUN_PUBLIC_KEY'),
    MAILGUN_SMTP_LOGIN: optionalEnv('MAILGUN_SMTP_LOGIN'),
    MAILGUN_SMTP_PASSWORD: optionalEnv('MAILGUN_SMTP_PASSWORD'),
    MAILGUN_SMTP_PORT: optionalEnv('MAILGUN_SMTP_PORT'),
    MAILGUN_SMTP_SERVER: optionalEnv('MAILGUN_SMTP_SERVER'),
    TYPEORM_OPTS: {
        type: 'postgres',
        name: 'default',
        host: mandatoryEnv('DATABASE_HOST'),
        username: mandatoryEnv('DATABASE_USERNAME'),
        password: mandatoryEnv('DATABASE_PASSWORD'),
        database: mandatoryEnv('DATABASE_NAME'),
        port: stringToInt(mandatoryEnv('DATABASE_PORT')),
        synchronize: stringToBool(mandatoryEnv('DATABASE_SYNCHRONIZE')),
        logging: mandatoryEnv('DATABASE_LOGGING'),
        logger: 'simple-console',
        entities: ['dist/src/entity/**/*.js'],
        migrations: ['dist/db/migration/**/*.js'],
        subscribers: ['dist/db/subscribers/**/*.js'],
        ssl: stringToBool(mandatoryEnv('DATABASE_SSL')) ? { rejectUnauthorized: false } : false,
    } as ConnectionOptions,
};
