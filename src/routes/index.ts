import * as Hapi from '@hapi/hapi';
import * as R from 'ramda';
import authenticationRoutes from './authentication-routes';
import postRoutes from './post-routes';

const routePrefix = '/api';

const defaultRouteConfig: Hapi.RouteOptions = {
    tags: ['api'],
    timeout: {
        server: 29000 // Heroku timeout is set to 30 seconds
    }
};

function applyDefaultRouteConfig(route: Hapi.ServerRoute): Hapi.ServerRoute {
    return {
        ...route,
        path: routePrefix + route.path,
        options: {
            ...defaultRouteConfig,
            ...route.options,
        },
    };
}

const routes: Hapi.ServerRoute[] = [
    ...authenticationRoutes,
    ...postRoutes,
];

export default R.map(applyDefaultRouteConfig, routes);
