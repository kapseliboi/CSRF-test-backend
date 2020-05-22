import * as Hapi from '@hapi/hapi';
import * as HapiSwagger from 'hapi-swagger';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as hapiRequireHttps from 'hapi-require-https';
import * as hapiJWT from 'hapi-auth-jwt2';
import * as crumb from '@hapi/crumb';

import config from './config';
import { validate } from './util/authentication';
import routes, { routePrefix } from './routes';

export async function initServer() {
    const server = await new Hapi.Server({
        host: config.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
        port: config.PORT,
        ...(config.FRONTEND_URL !== config.BACKEND_URL
            ? {
                  routes: {
                      cors: {
                          origin: [config.FRONTEND_URL, config.BACKEND_URL],
                          additionalHeaders: [config.CSRF_HEADER_NAME],
                          credentials: true,
                      },
                  },
              }
            : {}),
    });

    const swaggerOptions: HapiSwagger.RegisterOptions = {
        info: {
            title: 'CSRF test API Documentation',
            version: process.env.npm_package_version,
        },
        basePath: routePrefix,
        pathPrefixSize: 2,
    };

    const csrfOptions: crumb.RegisterOptions = {
        key: config.HTTPS_ONLY ? '__Host-csrf' : '_csrf',
        size: 43, // this is the default value which results in 256bits
        autoGenerate: true,
        addToViewContext: true,
        cookieOptions: {
            isHttpOnly: false,
            isSameSite: 'Strict',
            isSecure: config.HTTPS_ONLY,
            path: '/',
        },
        headerName: config.CSRF_HEADER_NAME,
        restful: true,
        logUnauthorized: false,
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
        },
        {
            plugin: crumb,
            options: csrfOptions,
        },
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
        path: '/',
    });

    // Serve react app
    if (config.FRONTEND_URL === config.BACKEND_URL) {
        routes.push({
            method: 'GET',
            path: "/{path*}",
            handler: {
                directory: {
                    path: 'dist/frontend',
                    listing: false,
                    index: true,
                },
            },
            options: {
                auth: false,
            },
        });
    }

    server.route(routes);
    console.log('Routes registered');

    await server.start();
    console.log(`Server is now listening on ${server.info.protocol}://${server.info.host}:${server.info.port}`);
}