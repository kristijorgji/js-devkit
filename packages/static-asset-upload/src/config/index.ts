export { defineStaticAssetsConfig } from './define-config.js';
export { expandPlaceholders, findConfigFile, loadConfig, resolveStaticAssetsConfig } from './load-config.js';
export type {
    ResolvedStaticAssetsConfig,
    StaticAssetStoreClient,
    StaticAssetTarget,
    StaticAssetUploadOptions,
    StaticAssetsConfig,
    UploadPlan,
    UploadPlanEntry,
    UploadResult,
    VersioningTier,
} from './types.js';
