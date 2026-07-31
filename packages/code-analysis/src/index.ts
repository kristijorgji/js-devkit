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
    resolveTestMocksConfig,
    resolveTestMocksConfig as resolveConfig,
} from './lib/config.js';
export type { CodeAnalysisFileConfig, ResolvedTestMocksConfig, TestMocksFlags } from './lib/config.js';

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
