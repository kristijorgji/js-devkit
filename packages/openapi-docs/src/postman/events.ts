import type { PostmanEvent, PostmanItem, PostmanVariable } from './types.js';

export function ensureVariable(variables: PostmanVariable[], key: string, value: string): void {
    const existing = variables.find((variable) => variable.key === key);
    if (existing) {
        existing.value = value;
        return;
    }

    variables.push({ key, value });
}

export function addOrReplaceEvent(
    target: { event?: PostmanEvent[] },
    listen: 'prerequest' | 'test',
    scriptLines: string[],
): void {
    const events = target.event ?? [];
    const existingIdx = events.findIndex((event) => event.listen === listen);
    const event: PostmanEvent = {
        listen,
        script: {
            type: 'text/javascript',
            exec: scriptLines,
        },
    };

    if (existingIdx >= 0) {
        events[existingIdx] = event;
    } else {
        events.push(event);
    }

    target.event = events;
}

export function walkItems(items: PostmanItem[] | undefined, visitor: (item: PostmanItem) => void): void {
    for (const item of items ?? []) {
        if (item.item) {
            walkItems(item.item, visitor);
            continue;
        }
        visitor(item);
    }
}

export function stripRequestExamples(items: PostmanItem[] | undefined): void {
    walkItems(items, (item) => {
        delete item.response;
    });
}
