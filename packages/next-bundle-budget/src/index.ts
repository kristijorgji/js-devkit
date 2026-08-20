export { detectAdapter, getAdapterById } from './adapters/detect.js';
export type { AdapterCapabilities, ChunkGroup, NextBuildOutputAdapter, PageOwnedChunks } from './adapters/types.js';
export { defineBundleBudgetConfig, resolveBundleBudgetConfig } from './config/index.js';
export type { BundleBudgetConfig, BundleBudgetsFile } from './config/types.js';
export { buildSizeLimitEntries } from './size-limit/compose-entries.js';
export type { SizeLimitEntry } from './size-limit/chunk-groups.js';
