import { Request, ResponseToolkit } from '@hapi/hapi';
import { ValidationResult } from 'hapi-auth-jwt2';

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
