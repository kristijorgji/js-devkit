export type AdapterId = 'next15-webpack' | 'next16-turbopack' | 'next16-webpack';

export interface AdapterCapabilities {
    /** false on next16-webpack: no app-build-manifest.json, no route-bundle-stats.json */
    perRouteChunks: boolean;
    /** false on Turbopack: chunk filenames are opaque hashes */
    namedRuntimeChunks: boolean;
}

/** A named, adapter-defined set of files the consumer can attach a limit to. */
export interface ChunkGroup {
    /** stable key used in bundle-budgets.json, e.g. 'framework', 'runtime', 'asyncChunks' */
    id: string;
    /** human label shown in size-limit output, e.g. 'Next framework' */
    label: string;
    /** dist-relative, already glob-escaped paths */
    paths: string[];
}

export interface PageOwnedChunks {
    /** already-normalized route path, e.g. '/[locale]/posts' */
    normalizedPath: string;
    /** original manifest key when available */
    manifestKey: string;
    /** dist-relative chunk paths owned by this page (shared + layout chunks removed) */
    chunkPaths: string[];
}

export interface SharedVendorChunk {
    id: string;
    filename: string;
    sizeBytes: number;
    globPath: string;
}

export interface NextBuildOutputAdapter {
    readonly id: AdapterId;
    readonly capabilities: AdapterCapabilities;
    detect(ctx: { distDir: string }): boolean;
    readBuildId(distDir: string): string | null;
    /** polyfillFiles + rootMainFiles — present on every bundler/version */
    readSharedBaseline(distDir: string): string[];
    listChunkGroups(distDir: string): ChunkGroup[];
    /** empty array when capabilities.perRouteChunks is false */
    listPageOwnedChunks(distDir: string): PageOwnedChunks[];
    /** app-relative path, or null when middleware is not a single file */
    resolveMiddlewarePath(distDir: string): string | null;
    listSharedVendorChunks(distDir: string): SharedVendorChunk[];
}
