import config from './config';
import {createConnection} from 'typeorm';

console.log(`Running environment ${config.NODE_ENV}`);

process.on('uncaughtException', (error: Error) => {
    console.error(`uncaughtException ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.error(`unhandledRejection ${reason}`);
});

async function start() {
    try {
        console.log('Running start function')
        await createConnection(config.TYPEORM_OPTS);
        console.log('Connected to database');
        (await import('./server')).initServer();
        console.log('Initialized server');
    }
    catch (e) {
        console.log(e);
    }
}

start();
