import * as Hapi from '@hapi/hapi';
import * as R from 'ramda';
import authenticationRoutes from './authentication-routes';


const defaultRouteConfig: Hapi.RouteOptions = {
    tags: ['api'],
    timeout: {
        server: 29000 // Heroku timeout is set to 30 seconds
    }
};

function applyDefaultRouteConfig(route: Hapi.ServerRoute): Hapi.ServerRoute {
    return {
        ...route,
        options: {
            ...defaultRouteConfig,
            ...route.options,
        },
    };
}

const routes: Hapi.ServerRoute[] = [
    ...authenticationRoutes,
];

export default R.map(applyDefaultRouteConfig, routes);
