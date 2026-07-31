import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE_GROUP_DIRECTORIES = ['apps', 'packages'];

function isDirectory(directoryPath: string): boolean {
    return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

/**
 * Detects scan paths for a repo:
 * - If `pnpm-workspace.yaml` exists and declares workspace packages, globs for
 *   existing `apps/*\/src` and `packages/*\/src` directories.
 * - Otherwise falls back to `['src']` if a top-level `src` directory exists,
 *   or `[]` when there is nothing to scan.
 */
export function detectScanPaths(repoRoot: string): string[] {
    const workspaceFile = path.join(repoRoot, 'pnpm-workspace.yaml');
    const detected: string[] = [];

    if (fs.existsSync(workspaceFile)) {
        const contents = fs.readFileSync(workspaceFile, 'utf8');
        const declaresPackages = /^\s*packages\s*:/m.test(contents);

        if (declaresPackages) {
            for (const groupDirectory of WORKSPACE_GROUP_DIRECTORIES) {
                const groupPath = path.join(repoRoot, groupDirectory);
                if (!isDirectory(groupPath)) {
                    continue;
                }

                for (const entry of fs.readdirSync(groupPath, { withFileTypes: true })) {
                    if (!entry.isDirectory()) {
                        continue;
                    }

                    const srcPath = path.join(groupPath, entry.name, 'src');
                    if (isDirectory(srcPath)) {
                        detected.push(`${groupDirectory}/${entry.name}/src`);
                    }
                }
            }
        }
    }

    if (detected.length > 0) {
        return detected.sort();
    }

    return isDirectory(path.join(repoRoot, 'src')) ? ['src'] : [];
}
