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

export const config = {
    NODE_ENV: mandatoryEnv('NODE_ENV'),
    PORT: optionalEnv('PORT') || 8080,
    DATABASE_URL: mandatoryEnv('DATABASE_URL'),
};
