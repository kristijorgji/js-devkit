export { defineStaticAssetsConfig, loadConfig, resolveStaticAssetsConfig } from './config/index.js';
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
} from './config/index.js';
export { assertRequiredTargets, resolveUploadPlan } from './plan/resolve-plan.js';
export { runStaticAssetUpload } from './upload/run-upload.js';
