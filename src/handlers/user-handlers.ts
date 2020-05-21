import * as Hapi from '@hapi/hapi';
import { AuthenticatedRequest, isAuthenticatedRequest } from '../types/requests';

export function currentUserHandler(req: Hapi.Request | AuthenticatedRequest, h: Hapi.ResponseToolkit) {
    if (isAuthenticatedRequest(req)) {
        const { username, email } = req.auth.credentials;
        return {
            username,
            email,
        }
    }
    return h.response();
}
