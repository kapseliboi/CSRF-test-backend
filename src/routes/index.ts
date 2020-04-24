import * as Hapi from '@hapi/hapi';
import * as R from 'ramda';
import * as Joi from '@hapi/joi';
import authenticationRoutes from './authentication-routes';
import postRoutes from './post-routes';
import config from '../config';


export const routePrefix = '/api';

function applyDefaultRouteConfig(route: Hapi.ServerRoute): Hapi.ServerRoute {
    const routeOptions = route.options as Hapi.RouteOptions | undefined;

    // Tags has to contain api for the route to be shown on swagger UI.
    const tags =
        routeOptions && routeOptions.tags
            ? R.append("api", routeOptions.tags)
            : ["api"];
    const csrfValidationObject = {
        [config.CSRF_HEADER_NAME]: Joi.string(),
    };

    return {
        ...route,
        path: routePrefix + route.path,
        options: {
            ...routeOptions,
            tags,
            timeout: {
                server: 29000, // Heroku timeout is set to 30 seconds
            },
            // Add csrf token here to use with swagger UI
            ...(!R.contains(route.method, ["GET", "OPTIONS", "HEAD"])
                ? {
                      validate: {
                          ...routeOptions.validate,
                          headers:
                              routeOptions.validate &&
                              routeOptions.validate.headers
                                  ? (routeOptions.validate
                                        .headers as Joi.ObjectSchema).append(
                                        csrfValidationObject
                                    )
                                  : Joi.object(csrfValidationObject).unknown(),
                      },
                  }
                : {}),
        },
    };
}

function applyPrefixToRoutes(routes: Hapi.ServerRoute[], prefix: string): Hapi.ServerRoute[] {
    return routes.map((route) => ({
        ...route,
        path: prefix + route.path,
    }));
}

const defaultRoute: Hapi.ServerRoute = {
    method: 'GET',
    path: '/test',
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => h.response,
    options: {
        auth: false,
        description: 'Empty route',
    },
};

const rawRoutes: Hapi.ServerRoute[] = [
    ...(applyPrefixToRoutes(authenticationRoutes, '/auth')),
    ...(applyPrefixToRoutes(postRoutes, '/post')),
    defaultRoute,
];

export default R.map(applyDefaultRouteConfig, rawRoutes);
