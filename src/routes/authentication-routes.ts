import * as Hapi from '@hapi/hapi';
import { loginHandler, registrationHandler, logoutHandler } from '../handlers/authentication-handlers';

export default [
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
        options: {
            auth: false,
            description: 'Login endpoint',
        },
    },
    {
        method: 'POST',
        path: '/register',
        handler: registrationHandler,
        options: {
            auth: false,
            description: 'Registration endpoint',
        },
    },
    {
        method: 'POST',
        path: '/logout',
        handler: logoutHandler,
        options: {
            description: 'Logout endpoint',
        }
    },
] as Hapi.ServerRoute[]