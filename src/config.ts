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
    SECRET_KEY: mandatoryEnv('SECRET_KEY'),
    HTTPS_ONLY: stringToBool(optionalEnv('HTTPS_ONLY')),
    PORT: optionalEnv('PORT') || 8080,
    DATABASE_URL: mandatoryEnv('DATABASE_URL'),
};
