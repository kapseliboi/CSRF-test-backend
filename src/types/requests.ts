import { Request, RequestAuth } from '@hapi/hapi';
import { JWTToken } from '../util/authentication';

export interface RegistrationRequest extends Request {
    payload: {
        username: string;
        email: string;
        password: string;
    };
};

export interface EmailVerificationRequest extends Omit<Request, 'params'> {
    params: {
        id: number;
        token: string;
    }
};

export interface LoginRequest extends Request {
    payload: {
        usernameOrEmail: string;
        password: string;
    }
}

export interface AuthenticatedRequest extends Omit<Request, 'auth'> {
    auth: JWTRequestAuth;
};

interface JWTRequestAuth extends Omit<RequestAuth, 'credentials'> {
    credentials: JWTToken;
};

export interface GetOrDeletePostRequest extends Omit<AuthenticatedRequest, 'params'> {
    params: {
        id: number;
    };
};

export interface CreatePostRequest extends AuthenticatedRequest {
    payload: {
        title: string;
        text: string;
    };
};

export interface EditPostRequest extends Omit<AuthenticatedRequest, 'params'> {
    payload: {
        title: string;
        text: string;
    };
    params: {
        id: number;
    };
};
