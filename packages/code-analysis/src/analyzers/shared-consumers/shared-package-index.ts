import fs from 'node:fs';
import path from 'node:path';

import { Node, type ImportDeclaration, Project, type SourceFile } from 'ts-morph';

import { resolveExportSubpath, type PackageExportsField } from './resolve-package-exports.js';

export interface InternalEdge {
    importer: string;
    dependency: string;
}

export interface SharedPackageIndex {
    declaringFiles: (subpath: string, names: string[] | '*') => string[];
    internalEdges: () => InternalEdge[];
    isBarrel: (file: string) => boolean;
}

function posixRelative(from: string, to: string): string {
    return path.relative(from, to).split(path.sep).join('/');
}

function namesFromSingleImport(declaration: ImportDeclaration): string[] | '*' {
    if (declaration.getNamespaceImport() || declaration.getImportClause() === undefined) {
        return '*';
    }
    const names: string[] = [];
    if (declaration.getDefaultImport()) {
        names.push('default');
    }
    for (const named of declaration.getNamedImports()) {
        names.push(named.getName());
    }
    return names.length > 0 ? names : '*';
}

export function createSharedPackageIndex(packageDir: string, exportsField: PackageExportsField): SharedPackageIndex {
    const project = new Project({ tsConfigFilePath: path.join(packageDir, 'tsconfig.json') });
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')) as {
        name?: string;
    };
    const packageName = packageJson.name;
    const packageRoot = path.resolve(packageDir);
    const exportedDeclarationsCache = new Map<string, ReturnType<SourceFile['getExportedDeclarations']>>();

    function toPosix(filePath: string): string {
        return posixRelative(packageDir, filePath);
    }

    function getCachedExportedDeclarations(sourceFile: SourceFile): ReturnType<SourceFile['getExportedDeclarations']> {
        const key = sourceFile.getFilePath();
        const cached = exportedDeclarationsCache.get(key);
        if (cached) {
            return cached;
        }
        const decls = sourceFile.getExportedDeclarations();
        exportedDeclarationsCache.set(key, decls);
        return decls;
    }

    function filesFromExportedDeclarations(
        sourceFile: SourceFile,
        names: string[] | '*'
    ): string[] {
        const decls = getCachedExportedDeclarations(sourceFile);
        const files = new Set<string>();
        const addDeclarations = (declarations: readonly { getSourceFile: () => SourceFile }[]): void => {
            for (const declaration of declarations) {
                files.add(toPosix(declaration.getSourceFile().getFilePath()));
            }
        };
        if (names === '*') {
            for (const declarations of decls.values()) {
                addDeclarations(declarations);
            }
        } else {
            for (const name of names) {
                addDeclarations(decls.get(name) ?? []);
            }
        }
        return [...files];
    }

    function resolveEntrySourceFile(subpath: string): SourceFile | undefined {
        const entry = resolveExportSubpath(exportsField, subpath);
        if (!entry) {
            return undefined;
        }
        const absolute = path.resolve(packageDir, entry);
        return project.getSourceFile(absolute) ?? project.addSourceFileAtPathIfExists(absolute);
    }

    function declaringFiles(subpath: string, names: string[] | '*'): string[] {
        const sourceFile = resolveEntrySourceFile(subpath);
        if (!sourceFile) {
            return [];
        }
        return filesFromExportedDeclarations(sourceFile, names);
    }

    function filesFromImport(declaration: ImportDeclaration): string[] {
        const local = declaration.getModuleSpecifierSourceFile();
        if (local) {
            const relative = path.relative(packageRoot, local.getFilePath());
            const insidePackage = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
            if (insidePackage) {
                return filesFromExportedDeclarations(local, namesFromSingleImport(declaration));
            }
        }
        if (!packageName) {
            return [];
        }
        const specifier = declaration.getModuleSpecifierValue();
        if (specifier !== packageName && !specifier.startsWith(`${packageName}/`)) {
            return [];
        }
        const subpath = `.${specifier.slice(packageName.length)}` || '.';
        return declaringFiles(subpath, namesFromSingleImport(declaration));
    }

    function internalEdges(): InternalEdge[] {
        const edges: InternalEdge[] = [];
        const seen = new Set<string>();
        for (const sourceFile of project.getSourceFiles()) {
            const importerPath = sourceFile.getFilePath();
            if (!importerPath.startsWith(`${packageRoot}${path.sep}`) && importerPath !== packageRoot) {
                continue;
            }
            const importer = toPosix(importerPath);
            for (const declaration of sourceFile.getImportDeclarations()) {
                for (const dependency of filesFromImport(declaration)) {
                    const key = `${importer}\0${dependency}`;
                    if (seen.has(key) || importer === dependency) {
                        continue;
                    }
                    seen.add(key);
                    edges.push({ importer, dependency });
                }
            }
        }
        return edges;
    }

    function isBarrel(file: string): boolean {
        const sourceFile = project.getSourceFile(path.join(packageDir, file));
        if (!sourceFile) {
            return false;
        }
        const statements = sourceFile.getStatements();
        if (statements.length === 0) {
            return false;
        }
        return statements.every(
            (statement) => Node.isExportDeclaration(statement) && statement.getModuleSpecifierValue() !== undefined
        );
    }

    return { declaringFiles, internalEdges, isBarrel };
}
