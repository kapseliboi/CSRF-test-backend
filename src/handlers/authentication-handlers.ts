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
I tried to make all handlers as immune to information leaks through timings as possible.
I have no idea how much of this is optimized away by V8 optimizing compiler.
The main point is to prevent leaking information about which emails are registered to
the service.
*/
export async function loginHandler(req: LoginRequest, h: Hapi.ResponseToolkit) {
    const { usernameOrEmail, password } = req.payload;
    var user: User;
    try {
        user = await userRepository.findOne(R.contains('@', usernameOrEmail) ?
            { email: usernameOrEmail }
            : { username: usernameOrEmail });
    }
    catch(err) {
        console.log(`Error occurred while trying to get user from database: ${err}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
    var fakePasswordHash: string;
    if (user) {
        try {
            if (await verifyPassword(user.passwordHash, password)) {
                // There shouldn't be a problem that disabled accounts and accounts with unconfirmed
                // email leak information through timings because an attacker shouldn't be able to
                // trigger this route on random users.
                if (!user.emailConfirmed) {
                    return h.response(ResponseStrings.accountEmailIsNotVerified).code(403);
                }
                else if (!user.isActive) {
                    return h.response(ResponseStrings.accountDisabled).code(403);
                }
                else {
                    const token = createJWT(user);
                    user.lastLogin = new Date();
                    try {
                        await userRepository.save(user);
                        return h.state('token', token);
                    }
                    catch(err) {
                        console.log(`Error while saving last_login of user: ${err}`);
                        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
                    }
                }
            }
        }
        catch(err) {
            console.log(`Error while verifying password: ${err}`);
            return Boom.internal(ResponseStrings.internalSomethingWentWrong);
        }
    }
    else {
        // This most likely doesn't have the exactly same cost as verifying password
        // due to missing comparison element. I'm hoping network latency hides the difference.
        try {
            fakePasswordHash = await hashPassword(password);
        }
        catch(err) {
            console.log(`Error while hashing fake password: ${err}`);
            return Boom.internal(ResponseStrings.internalSomethingWentWrong);
        }
    }
    const fakeJWT = createFakeJWT(usernameOrEmail);
    const fakeUser = new User();
    fakeUser.email = usernameOrEmail;
    fakeUser.username = usernameOrEmail.substring(0, 50);
    fakeUser.passwordHash = fakePasswordHash || fakeJWT;
    fakeUser.lastLogin = new Date();
    await fakeUserRepository.save(fakeUser);
    return Boom.unauthorized(ResponseStrings.credentialsIncorrect);
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
    var shouldCreateNewUser = true;
    var newUser = new User();
    newUser.username = username;
    newUser.email = email;

    // Check that no other user has the same email address.
    // This is information we should not disclose directly to a web client.
    const emailUser = await userRepository.findOne({ email });

    var emailSendFunction = (user: User) => {
        return new Promise((resolve) => {
            setTimeout(resolve, Math.random() * (40) + 80); //set timeout between 80-120ms (simulate mailgun API)
        });
    };
    if (!R.isNil(emailUser)) {
        shouldCreateNewUser = false;
        if (emailUser.emailConfirmed) {
            if (emailUser.isActive) {
                emailSendFunction = sendEmailAlreadyRegisteredEmail;
            }
            else {
                emailSendFunction = sendAccountDisabled;
            }
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
            console.log('Saving fake user to database failed');
            return Boom.internal(ResponseStrings.internalSomethingWentWrong);
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
    return h.unstate('token');
}

export async function emailVerificationHandler(req: EmailVerificationRequest, h: Hapi.ResponseToolkit) {
    const { id, token } = req.params;
    const userPromise = userRepository.findOne({ id: parseInt(id, 10) });

    const verificationFailedHTML =
        `<!DOCTYPE html>
        <html>
            <title>CSRFTest - Email succesfully confirmed</title>
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
