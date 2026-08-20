import { cliLogger } from '@kristijorgji/cli-kit';

import type { ResolvedOpenApiDocsConfig } from '../config/types.js';
import { writePostmanCollection } from '../postman/generate.js';

export async function runPostman(config: ResolvedOpenApiDocsConfig): Promise<void> {
    const output = await writePostmanCollection(config);
    cliLogger.info(`Wrote ${output}`);
}
