import config from './config';
import {createConnection} from 'typeorm';
import { initServer } from './server';

console.log(`Running environment ${config.NODE_ENV}`);

process.on('uncaughtException', (error: Error) => {
    console.error(`uncaughtException ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.error(`unhandledRejection ${reason}`);
});

async function start() {
    try {
        await createConnection();
        await initServer();
    }
    catch (e) {
        console.log(e);
    }
}

start();
