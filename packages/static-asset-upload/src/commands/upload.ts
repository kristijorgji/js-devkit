import { cliLogger } from '@kristijorgji/cli-kit';

import type { ResolvedStaticAssetsConfig } from '../config/types.js';
import { runStaticAssetUpload } from '../upload/run-upload.js';

export async function runUpload(
    config: ResolvedStaticAssetsConfig,
    options: { dryRun: boolean },
): Promise<void> {
    const result = await runStaticAssetUpload(config, { dryRun: options.dryRun });
    if (options.dryRun) {
        cliLogger.info('Dry run complete');
        return;
    }
    cliLogger.info(`Upload complete (${result.totalUploaded} files)`);
}
