import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_IGNORE_DIRECTORIES = ['node_modules', 'dist', 'coverage', '.turbo'];

export function walkDirectory(
    directoryPath: string,
    onFile: (filePath: string) => void,
    options?: { ignoreDirectories?: string[] }
): void {
    const ignoreDirectories = options?.ignoreDirectories ?? DEFAULT_IGNORE_DIRECTORIES;

    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
        const entryPath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            if (ignoreDirectories.includes(entry.name)) {
                continue;
            }

            walkDirectory(entryPath, onFile, options);
            continue;
        }

        if (entry.isFile()) {
            onFile(entryPath);
        }
    }
}
