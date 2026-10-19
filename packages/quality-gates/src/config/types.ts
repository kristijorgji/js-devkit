import type { PackageManagerAdapter, PackageManagerName } from '../package-manager.js';
import type { Gate } from '../types.js';

export interface QualityGatesConfig {
    /** Defaults to `auto` (package.json#packageManager, then lockfile). */
    packageManager?: PackageManagerName | 'auto';
    /** Roots used to map turbo/tsc package-relative paths back to repo paths. Default `['apps', 'packages']`. */
    packageRoots?: readonly string[];
    /** Directory under the repo root for per-gate logs. Default `.quality-gates`. */
    logDir?: string;
    /** Prefix printed in rerun commands. Default is the package manager's `quality:working-tree` script. */
    workingTreeScript?: string;
    gates: readonly Gate[];
}

export interface ResolvedQualityGatesConfig {
    packageManager: PackageManagerAdapter;
    packageRoots: readonly string[];
    logDir: string;
    workingTreeScript: string;
    gates: readonly Gate[];
}
