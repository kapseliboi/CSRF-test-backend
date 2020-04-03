import * as Hapi from '@hapi/hapi';
import * as HapiSwagger from 'hapi-swagger';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as hapiRequireHttps from 'hapi-require-https';
import * as hapiJWT from 'hapi-auth-jwt2';

import config from './config';
import { validate } from './util/authentication';
import routes from './routes';

export async function initServer() {
    const server = await new Hapi.Server({
        host: 'localhost',
        port: config.PORT,
    });

    const swaggerOptions: HapiSwagger.RegisterOptions = {
        info: {
            title: 'CSRF test API Documentation',
            version: process.env.npm_package_version,
        }
    };

    const plugins = [
        {
            plugin: Inert,
        },
        {
            plugin: Vision
        },
        {
            plugin: HapiSwagger,
            options: swaggerOptions,
        },
        {
            plugin: hapiJWT,
        }
    ];

    if (config.HTTPS_ONLY) {
        console.log('HTTPS only enabled');
        plugins.push({
            plugin: hapiRequireHttps
        });
    }

    await server.register(plugins);

    server.auth.strategy('jwt', 'jwt',
    {
        key: config.JWT_SECRET_KEY,
        validate,
        verifyOptions: {
            algorithms: [ 'HS256' ],
        },
    } as any);

    server.auth.default('jwt');

    server.state('token', {
        ttl: 1000*60*60*24, // valid for 1 day
        isSecure: config.HTTPS_ONLY,
        isHttpOnly: true,
        isSameSite: 'Strict',
        encoding: 'none',
        strictHeader: true,
        clearInvalid: true,
    });


    server.route(routes)
    console.log('Routes registered');

    await server.start();
    console.log(`Server is now listening on ${server.info.protocol}://${server.info.host}:${server.info.port}`);
}