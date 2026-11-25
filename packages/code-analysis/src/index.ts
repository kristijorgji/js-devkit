export {
    analyzeTestMocks,
    DEFAULT_DELEGATE_PATTERNS,
    DEFAULT_IGNORE_DIRECTORIES,
    DEFAULT_SCAN_PATHS,
    DEFAULT_SIMILARITY_THRESHOLD,
    factoryDelegatesToHelper,
    factoryJaccardSimilarity,
    hashFactoryBody,
    jaccardSimilarity,
    listTestFiles,
    resolveMockModuleKey,
    tokenizeFactory,
} from './analyzers/test-mocks/analyze-test-mocks.js';
export type {
    AlreadyUsingHelperGroup,
    AnalyzeTestMocksOptions,
    AnalyzeTestMocksResult,
    MockGroupStatus,
    MockModuleGroup,
    MockOccurrence,
    ResolveMockModuleKeyOptions,
    SimilarPairRef,
    TopSimilarPair,
} from './analyzers/test-mocks/analyze-test-mocks.js';

export { formatReport } from './analyzers/test-mocks/format-report.js';

export { detectScanPaths } from './lib/detect-scan-paths.js';

export {
    loadConfigFile,
    loadConfigFile as loadConfig,
    resolveSharedConsumersConfig,
    resolveSizeBaselineConfig,
    resolveTestMocksConfig,
    resolveTestMocksConfig as resolveConfig,
} from './lib/config.js';
export type {
    CodeAnalysisFileConfig,
    ResolvedSharedConsumer,
    ResolvedSharedConsumersConfig,
    ResolvedSharedConsumersPackage,
    ResolvedSizeBaselineConfig,
    ResolvedSizeBaselinePackage,
    ResolvedTestMocksConfig,
    SharedConsumersFlags as SharedConsumersConfigFlags,
    SizeBaselineFlags,
    TestMocksFlags,
} from './lib/config.js';

export { parseSizeViolation } from './analyzers/size-baseline/parse-size-violation.js';
export type { SizeViolation } from './analyzers/size-baseline/parse-size-violation.js';
export { collectSizeViolations } from './analyzers/size-baseline/collect-size-violations.js';
export type { CollectSizeViolationsInput } from './analyzers/size-baseline/collect-size-violations.js';
export { mergeSizeBaseline } from './analyzers/size-baseline/merge-size-baseline.js';
export type { MergeSizeBaselineResult, SizeBaselineChange } from './analyzers/size-baseline/merge-size-baseline.js';

export { resolveExportSubpath } from './analyzers/shared-consumers/resolve-package-exports.js';
export type { PackageExportsField } from './analyzers/shared-consumers/resolve-package-exports.js';
export { collectConsumerImports } from './analyzers/shared-consumers/collect-consumer-imports.js';
export type {
    CollectConsumerImportsInput,
    ConsumerImport,
    ResolvedConsumer,
} from './analyzers/shared-consumers/collect-consumer-imports.js';
export { createSharedPackageIndex } from './analyzers/shared-consumers/shared-package-index.js';
export type { InternalEdge, SharedPackageIndex } from './analyzers/shared-consumers/shared-package-index.js';
export { computeSharedConsumers } from './analyzers/shared-consumers/compute-shared-consumers.js';
export { checkSharedConsumers } from './analyzers/shared-consumers/check-shared-consumers.js';
export type {
    CheckSharedConsumersInput,
    CheckSharedConsumersResult,
    SharedConsumersBaseline,
    SharedConsumersBaselineEntry,
    SharedConsumerViolation,
} from './analyzers/shared-consumers/check-shared-consumers.js';

export {
    clearPathAliasesCache,
    DEFAULT_PATH_ALIASES,
    deriveScanRootsFromScanPaths,
    findScanRoot,
    getPathAliases,
    loadPathAliasesFromTsconfig,
    resolvePathAlias,
} from './lib/tsconfig-path-aliases.js';
export type { PathAlias } from './lib/tsconfig-path-aliases.js';

export { walkDirectory } from './lib/walk-directory.js';
export { logger } from './lib/logger.js';
export type { Logger } from './lib/logger.js';
