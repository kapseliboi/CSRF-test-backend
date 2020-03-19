import { config } from './config/config';

console.log(`Running environment ${config.NODE_ENV}`);

process.on('uncaughtException', (error: Error) => {
    console.error(`uncaughtException ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.error(`unhandledRejection ${reason}`);
});

async function start() {
    try {
        
    }
    catch {
        
    }
}
