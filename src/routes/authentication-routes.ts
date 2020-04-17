import * as Hapi from '@hapi/hapi';
import { loginHandler, registrationHandler, logoutHandler, emailVerificationHandler } from '../handlers/authentication-handlers';
import * as Joi from '@hapi/joi';

export default [
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
        options: {
            auth: false,
            description: 'Login endpoint',
            validate: {
                payload: Joi.object({
                    usernameOrEmail: Joi.string().max(254).required(),
                    password: Joi.string().max(100).required(),
                }),
            },
        },
    },
    {
        method: 'POST',
        path: '/register',
        handler: registrationHandler,
        options: {
            auth: false,
            description: 'Registration endpoint',
            validate: {
                payload: Joi.object({
                    username: Joi.string().min(3).max(50).not('@').required(),
                    email: Joi.string().email().max(254).required(),
                    password: Joi.string().min(8).max(50).required(),
                }),
            },
        },
    },
    {
        method: 'POST',
        path: '/logout',
        handler: logoutHandler,
        options: {
            auth: 'jwt',
            description: 'Logout endpoint',
        }
    },
    {
        method: 'GET',
        path: '/verify-email/{id}/{token}',
        handler: emailVerificationHandler,
        options: {
            auth: false,
            description: 'Email verification endpoint',
            validate: {
                params: Joi.object({
                    id: Joi.number().positive().required(),
                    token: Joi.string().required(),
                })
            }
        }
    }
] as Hapi.ServerRoute[]