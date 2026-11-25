import fs from 'node:fs';
import path from 'node:path';

import { Project, SyntaxKind, type SourceFile } from 'ts-morph';

import { walkDirectory } from '../../lib/walk-directory.js';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);

export interface ResolvedConsumer {
    name: string;
    scanDirs: string[];
}

export interface ConsumerImport {
    consumer: string;
    file: string;
    subpath: string;
    names: string[] | '*';
}

export interface CollectConsumerImportsInput {
    repoRoot: string;
    packageName: string;
    consumers: ResolvedConsumer[];
    ignoreDirectories: string[];
    ignoreFilePatterns: RegExp[];
}

function posixRelative(from: string, to: string): string {
    return path.relative(from, to).split(path.sep).join('/');
}

function namesFromImportDeclaration(sourceFile: SourceFile, specifier: string): string[] | '*' {
    const names: string[] = [];
    for (const declaration of sourceFile.getImportDeclarations()) {
        if (declaration.getModuleSpecifierValue() !== specifier) {
            continue;
        }
        if (declaration.getNamespaceImport() || declaration.getImportClause() === undefined) {
            return '*';
        }
        if (declaration.getDefaultImport()) {
            names.push('default');
        }
        for (const named of declaration.getNamedImports()) {
            names.push(named.getName());
        }
    }
    return names.length > 0 ? names : '*';
}

function namesFromExportDeclaration(sourceFile: SourceFile, specifier: string): string[] | '*' {
    const names: string[] = [];
    for (const declaration of sourceFile.getExportDeclarations()) {
        if (declaration.getModuleSpecifierValue() !== specifier) {
            continue;
        }
        const named = declaration.getNamedExports();
        if (named.length === 0) {
            return '*';
        }
        for (const entry of named) {
            names.push(entry.getName());
        }
    }
    return names.length > 0 ? names : '*';
}

function collectSpecifiers(sourceFile: SourceFile, packageName: string): Array<{ subpath: string; names: string[] | '*' }> {
    const prefix = `${packageName}/`;
    const found = new Map<string, string[] | '*'>();

    const add = (specifier: string, names: string[] | '*'): void => {
        if (specifier !== packageName && !specifier.startsWith(prefix)) {
            return;
        }
        const subpath = `.${specifier.slice(packageName.length)}` || '.';
        const existing = found.get(subpath);
        if (names === '*' || existing === '*') {
            found.set(subpath, '*');
            return;
        }
        found.set(subpath, [...new Set([...(existing ?? []), ...names])]);
    };

    for (const declaration of sourceFile.getImportDeclarations()) {
        const specifier = declaration.getModuleSpecifierValue();
        add(specifier, namesFromImportDeclaration(sourceFile, specifier));
    }
    for (const declaration of sourceFile.getExportDeclarations()) {
        const specifier = declaration.getModuleSpecifierValue();
        if (!specifier) continue;
        add(specifier, namesFromExportDeclaration(sourceFile, specifier));
    }
    for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        if (call.getExpression().getKind() !== SyntaxKind.ImportKeyword) {
            continue;
        }
        const arg = call.getArguments()[0];
        if (!arg || arg.getKind() !== SyntaxKind.StringLiteral) {
            continue;
        }
        add(arg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText(), '*');
    }

    return [...found.entries()].map(([subpath, names]) => ({ subpath, names }));
}

export function collectConsumerImports(input: CollectConsumerImportsInput): ConsumerImport[] {
    const project = new Project({
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        compilerOptions: { allowJs: true },
    });
    const results: ConsumerImport[] = [];

    for (const consumer of input.consumers) {
        for (const scanDir of consumer.scanDirs) {
            if (!scanDir || !fs.existsSync(scanDir)) continue;
            walkDirectory(
                scanDir,
                (filePath) => {
                    const ext = path.extname(filePath);
                    if (!SOURCE_EXTENSIONS.has(ext)) {
                        return;
                    }
                    const relative = posixRelative(input.repoRoot, filePath);
                    if (input.ignoreFilePatterns.some((pattern) => pattern.test(relative))) {
                        return;
                    }
                    const sourceFile = project.addSourceFileAtPath(filePath);
                    for (const match of collectSpecifiers(sourceFile, input.packageName)) {
                        results.push({
                            consumer: consumer.name,
                            file: relative,
                            subpath: match.subpath,
                            names: match.names,
                        });
                    }
                },
                { ignoreDirectories: input.ignoreDirectories }
            );
        }
    }

    return results;
}
