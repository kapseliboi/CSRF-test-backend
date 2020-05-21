import * as Hapi from '@hapi/hapi';
import * as R from 'ramda';
import * as Boom from '@hapi/boom';
import { RegistrationRequest, EmailVerificationRequest, LoginRequest } from '../types/requests';
import { userRepository, fakeUserRepository } from '../repositories';
import { sendEmailAlreadyRegisteredEmail, sendRegistrationEmail, sendAccountDisabled } from '../services/email';
import { User } from '../entity/User';
import { hashPassword, verifyEmailValidationToken, verifyPassword, createJWT, createFakeJWT } from '../util/authentication';
import config from '../config';
import { ResponseStrings } from '../constants/strings';

/*
Argon2id hash for password 'testing123'. It will be used in timing attack mitigation
*/
const fakeArgon2idHash = '$argon2id$v=19$m=4096,t=3,p=1$oy5aqGhs/v6w/gm5jFE/kA$dduy6z+j8BnxAIWzMG7NZJdTQ+wgH8wHD9YkJgQ55Q7E2a4CHR4qJQ';

/*
I tried to make all handlers as immune to information leaks through timings as possible.
I have no idea how much of this is optimized away by V8 optimizing compiler.
The main point is to prevent leaking information about which emails are registered to
the service.
*/

async function fakeLoginComputing(usernameOrEmail: string, fakePasswordVerifyRes: boolean) {
    const fakeJWT = createFakeJWT(usernameOrEmail, fakePasswordVerifyRes);
    const fakeUser = new User();
    fakeUser.email = usernameOrEmail;
    fakeUser.username = usernameOrEmail.substring(0, 50);
    fakeUser.passwordHash = fakeJWT;
    fakeUser.lastLogin = new Date();
    try {
        await fakeUserRepository.save(fakeUser);
    }
    /* tslint:disable-next-line:no-empty */
    catch {}
    return Boom.unauthorized(ResponseStrings.credentialsIncorrect);
}

export async function loginHandler(req: LoginRequest, h: Hapi.ResponseToolkit) {
    const { usernameOrEmail, password } = req.payload;
    let user: User;
    try {
        user = await userRepository.findOne(R.contains('@', usernameOrEmail) ?
            { email: usernameOrEmail }
            : { username: usernameOrEmail });
    }
    catch(err) {
        console.log(`Error occurred while trying to get user from database: ${err}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
    if (!user) {
        let fakePasswordVerifyRes: boolean;
        try {
            fakePasswordVerifyRes = await verifyPassword(fakeArgon2idHash, password);
        }
        catch(err) {
            console.log(`Error while hashing fake password: ${err}`);
            return Boom.internal(ResponseStrings.internalSomethingWentWrong);
        }

        return (await fakeLoginComputing(usernameOrEmail, fakePasswordVerifyRes));
    }

    try {
        if (await verifyPassword(user.passwordHash, password)) {
            // There shouldn't be a problem that disabled accounts and accounts with unconfirmed
            // email leak information through timings because an attacker shouldn't be able to
            // trigger this route on random users.
            if (!user.emailConfirmed) {
                return Boom.forbidden(ResponseStrings.accountEmailIsNotVerified);
            }
            else if (!user.isActive) {
                return Boom.forbidden(ResponseStrings.accountDisabled);
            }
            else {
                const token = createJWT(user);
                user.lastLogin = new Date();
                try {
                    await userRepository.save(user);
                    h.state('token', token);
                    return {
                        username: user.username,
                        email: user.email,
                    };
                }
                catch(err) {
                    console.log(`Error while saving last_login of user: ${err}`);
                    return Boom.internal(ResponseStrings.internalSomethingWentWrong);
                }
            }
        }
        else {
            return (await fakeLoginComputing(usernameOrEmail, false));
        }
    }
    catch(err) {
        console.log(`Error while verifying password: ${err}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

export async function registrationHandler(req: RegistrationRequest, h: Hapi.ResponseToolkit) {
    const { username, email, password } = req.payload;

    // Check that no other username with the same name exists
    const usernameUser = await userRepository.findOne({ username });
    if (!R.isNil(usernameUser)) {
        return Boom.conflict('Username is already in use.');
    }

    // Execute whole registration process if a user can't be created due to email.
    // This is to reduce the chance of a potential attacker from gaining any extra information from timings.
    let shouldCreateNewUser = true;
    let newUser = new User();
    newUser.username = username;
    newUser.email = email;

    // Check that no other user has the same email address.
    // This is information we should not disclose directly to a web client.
    const emailUser = await userRepository.findOne({ email });

    let emailSendFunction;
    if (!R.isNil(emailUser)) {
        if (emailUser.emailConfirmed) {
            shouldCreateNewUser = false;
            if (emailUser.isActive) {
                emailSendFunction = sendEmailAlreadyRegisteredEmail;
            }
            else {
                emailSendFunction = sendAccountDisabled;
            }
        } else {
            emailSendFunction = sendRegistrationEmail;
            newUser = emailUser;
        }
    }
    else {
        emailSendFunction = sendRegistrationEmail;
    }
    try {
        newUser.passwordHash = await hashPassword(password);
    }
    catch(err) {
        console.log(`Something went wrong while hashing user provided password: ${err}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }

    if (shouldCreateNewUser) {
        try {
            newUser = await userRepository.save(newUser);
        }
        catch(err) {
            console.log(`An error occurred while saving new user to dabase: ${err}`);
            return Boom.internal(ResponseStrings.internalSomethingWentWrong);
        }
    }
    else {
        try {
            await fakeUserRepository.save(newUser);
        }
        catch(err) {
            console.log('Saving fake user to database failed, most likely because another user with same name exists.');
        }
    }

    try {
        await emailSendFunction(newUser);
    }
    catch(err) {
        console.log(`An error occurred while sending verification email: ${err}`);
        return Boom.internal(ResponseStrings.unableToSendVerificationEmail);
    }

    return h.response().code(201);
}

export function logoutHandler(req: Hapi.Request, h: Hapi.ResponseToolkit) {
    h.unstate('token');
    return h.response();
}

export async function emailVerificationHandler(req: EmailVerificationRequest, h: Hapi.ResponseToolkit) {
    const { id, token } = req.params;
    const userPromise = userRepository.findOne(id);

    const verificationFailedHTML =
        `<!DOCTYPE html>
        <html>
            <title>CSRFTest - Email not confirmed</title>
            <body>
                <p>Email verification was not succesful<p>
            </body>
        </html>`;

    // Check that token could be a correct one
    if (!R.contains('-', token)) {
        return h.response(verificationFailedHTML).type('text/html').code(400);
    }
    try {
        const user = await userPromise;
        if (!user || (!await verifyEmailValidationToken(token, user))) {
            return h.response(verificationFailedHTML).type('text/html').code(400);
        }
        user.emailConfirmed = true;
        await userRepository.save(user);
    }
    catch(err) {
        console.log(err);
        return h.response(verificationFailedHTML).type('text/html').code(500);
    }

    return h.response(
    `<!DOCTYPE html>
    <html>
        <title>CSRFTest - Email succesfully confirmed</title>
        <body>
            <p>
                Your email address has been confirmed. To login please click <a href="${config.FRONTEND_URL}">here</a>
            </p>
        </body>
    </html>`
    ).type('text/html');
}
