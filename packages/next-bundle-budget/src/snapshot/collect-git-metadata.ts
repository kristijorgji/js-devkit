import { execSync } from 'node:child_process';

export interface GitMetadata {
    commitSha: string;
    author: string;
    commitMessage: string;
    branch: string;
}

function runGit(command: string, cwd: string): string {
    return execSync(command, { encoding: 'utf8', cwd }).trim();
}

export function collectGitMetadata(cwd: string = process.cwd()): GitMetadata {
    return {
        commitSha: runGit('git rev-parse HEAD', cwd),
        author: runGit('git log -1 --format=%ae', cwd),
        commitMessage: runGit('git log -1 --format=%s', cwd),
        branch: runGit('git rev-parse --abbrev-ref HEAD', cwd),
    };
}
