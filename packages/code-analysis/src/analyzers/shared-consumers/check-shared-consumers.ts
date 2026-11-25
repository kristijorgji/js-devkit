export interface SharedConsumersBaselineEntry {
    consumers: string[];
    reason: string;
}

export type SharedConsumersBaseline = Record<string, SharedConsumersBaselineEntry>;

export interface SharedConsumerViolation {
    file: string;
    consumers: string[];
}

export interface CheckSharedConsumersInput {
    files: string[];
    consumers: Map<string, Set<string>>;
    minConsumers: number;
    sharedConsumers: string[];
    ignore: RegExp[];
    isBarrel: (file: string) => boolean;
    baseline: SharedConsumersBaseline;
}

export interface CheckSharedConsumersResult {
    violations: SharedConsumerViolation[];
    newViolations: SharedConsumerViolation[];
    stale: string[];
}

export function checkSharedConsumers(input: CheckSharedConsumersInput): CheckSharedConsumersResult {
    const shared = new Set(input.sharedConsumers);
    const violations: SharedConsumerViolation[] = [];

    for (const file of input.files) {
        if (input.isBarrel(file)) {
            continue;
        }
        if (input.ignore.some((pattern) => pattern.test(file))) {
            continue;
        }
        const fileConsumers = [...(input.consumers.get(file) ?? [])].sort();
        const hasSharedConsumer = fileConsumers.some((consumer) => shared.has(consumer));
        if (hasSharedConsumer || fileConsumers.length >= input.minConsumers) {
            continue;
        }
        violations.push({ file, consumers: fileConsumers });
    }

    violations.sort((left, right) => left.file.localeCompare(right.file));
    const violationFiles = new Set(violations.map((violation) => violation.file));
    const newViolations = violations.filter((violation) => input.baseline[violation.file] === undefined);
    const stale = Object.keys(input.baseline)
        .filter((file) => !violationFiles.has(file))
        .sort();

    return { violations, newViolations, stale };
}
