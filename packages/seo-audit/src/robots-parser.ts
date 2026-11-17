import robotsParserModule from 'robots-parser';

export interface RobotsRules {
    isAllowed(url: string, ua?: string): boolean | undefined;
    getSitemaps(): string[];
}

export type RobotsParserFn = (url: string, robotstxt: string) => RobotsRules;

function resolveRobotsParser(mod: unknown): RobotsParserFn {
    if (typeof mod === 'function') {
        return mod as RobotsParserFn;
    }
    if (
        mod &&
        typeof mod === 'object' &&
        'default' in mod &&
        typeof (mod as { default: unknown }).default === 'function'
    ) {
        return (mod as { default: RobotsParserFn }).default;
    }
    throw new Error('robots-parser did not export a function');
}

export const robotsParser = resolveRobotsParser(robotsParserModule);
