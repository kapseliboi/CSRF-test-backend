import config from './config';
import {createConnection} from 'typeorm';
import { AddDatabaseTriggers } from './util/database';

console.log(`Running environment ${config.NODE_ENV}`);

process.on('uncaughtException', (error: Error) => {
    console.error(`uncaughtException ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.error(`unhandledRejection ${reason}`);
});

async function start() {
    try {
        const connection = await createConnection();
        await AddDatabaseTriggers(connection);
        (await import('./server')).initServer();
    }
    catch (e) {
        console.log(e);
    }
}

start();
