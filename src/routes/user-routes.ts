import * as Hapi from '@hapi/hapi';
import { currentUserHandler } from '../handlers/user-handlers';

export default [
    {
        method: 'GET',
        path: '/',
        handler: currentUserHandler,
        options: {
            auth: false,
            description: 'Get current user. Return empty object if no user',
        },
    },
] as Hapi.ServerRoute[];
