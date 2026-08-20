import type { Logger } from 'pino';
import pino from 'pino';
import 'pino-pretty';

const CLI_PRETTY_OPTIONS = {
    colorize: true,
    levelFirst: true,
    translateTime: 'SYS:HH:MM:ss.l',
    ignore: 'pid,hostname',
    hideObject: true,
} as const;

export function createCliLogger(level = 'info'): Logger {
    return pino({
        level,
        transport: {
            target: 'pino-pretty',
            options: CLI_PRETTY_OPTIONS,
        },
    });
}

/** Default logger for scripts that do not load a custom log level from env. */
export const cliLogger = createCliLogger();

export function logFatalAndExit(msg: string): never {
    cliLogger.error(msg);
    process.exit(1);
}

export function logFatalAndExitFromError(err: unknown): never {
    logFatalAndExit(err instanceof Error ? err.message : String(err));
}
