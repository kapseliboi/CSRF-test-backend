import { Request, ResponseToolkit } from '@hapi/hapi';
import { ValidationResult } from 'hapi-auth-jwt2';
import { User } from '../entity/User';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import config from '../config';

const argon2Options: argon2.Options & {raw?: false} = {
    type: argon2.argon2id,
    hashLength: 40 // length in bytes
};

export interface JWTToken {
    id: number;
    username: string;
    email: string;
}

export function validate(decoded: JWTToken, req: Request, h: ResponseToolkit): ValidationResult {
    return {
        isValid: true
    };
}

export async function createEmailValidationToken(user: User, timestampBase36?: string) {
    const tsBase36 = timestampBase36 ?? Math.round(new Date().getTime() / 1000).toString(36);
    try {
        const hash = await argon2.hash(createStringtoHashEmailValidation(user, tsBase36), argon2Options);
        return `${tsBase36}-${hash}`;
    }
    catch(err) {
        console.log(err);
        throw Error('Argon2 hashing failed');
    }
}

export async function verifyEmailValidationToken(token: string, user: User) {
    const tsBase36 = token.split('-', 1)[0];
    const hash = token.substring(tsBase36.length + 1);
    const recreatedPlainText = createStringtoHashEmailValidation(user, tsBase36);
    try {
        return await argon2.verify(hash, recreatedPlainText, argon2Options);
    }
    catch(err) {
        console.log(err);
        throw Error('Argon2 verify failed');
    }
}

function createStringtoHashEmailValidation(user: User, timestampBase36: string) {
    return user.id.toString() + config.EMAIL_TOKEN_SECRET_KEY + timestampBase36 + user.emailConfirmed.toString();
}

export async function hashPassword(passwordPlain: string) {
    return await argon2.hash(passwordPlain, argon2Options);
}

export async function verifyPassword( passwordHash: string, passwordPlain: string) {
    return await argon2.verify(passwordHash, passwordPlain);
}

export function createJWT(user: User) {
    const data = {
        id: user.id,
        username: user.username,
        email: user.email,
    };

    return jwt.sign(data, config.JWT_SECRET_KEY, { expiresIn: '12h' });
}

export function createFakeJWT(usernameOrEmail: string) {
    const data = {
        id: (Math.random() * 1000).toFixed(0).toString(),
        username: usernameOrEmail,
        email: usernameOrEmail,
    }

    return jwt.sign(data, config.JWT_SECRET_KEY, { expiresIn: '12h' });
}
