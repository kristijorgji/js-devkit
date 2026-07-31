export interface Logger {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
}

/**
 * Minimal, dependency-free logger. Kept intentionally simple so this package
 * has no runtime dependency on any host repo's logging setup.
 */
export const logger: Logger = {
    info: (message: string): void => console.log(message),
    warn: (message: string): void => console.warn(message),
    error: (message: string): void => console.error(message),
};
