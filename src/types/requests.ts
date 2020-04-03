import { Request } from '@hapi/hapi';

export interface RegistrationRequest extends Request {
    payload: {
        username: string;
        email: string;
        password: string;
    };
};

export interface EmailVerificationRequest extends Request {
    params: {
        id: string;
        token: string;
    };
};

export interface LoginRequest extends Request {
    payload: {
        usernameOrEmail: string;
        password: string;
    }
}