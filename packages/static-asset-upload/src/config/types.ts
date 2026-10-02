export type VersioningTier = 'commit' | 'shared';

export interface StaticAssetTarget {
    id: string;
    localDir: string;
    /** `{commitPrefix}` and `{sharedPrefix}` are expanded by the planner. */
    remotePrefix: string;
    versioning: VersioningTier;
    /** Caller-supplied Cache-Control header value. */
    cacheControl: string;
    optional?: boolean;
    include?: readonly string[];
    exclude?: readonly string[];
}

export interface StaticAssetsConfig {
    root: string;
    bucket: string;
    region?: string;
    commit: string;
    /** S3-compatible endpoint (R2, MinIO). Omit for AWS. */
    endpoint?: string;
    forcePathStyle?: boolean;
    /** May include `{commit}`; expanded before remote prefixes. */
    commitPrefix: string;
    sharedPrefix: string;
    targets: readonly StaticAssetTarget[];
    targetIds?: readonly string[];
    requiredTargetIds?: readonly string[];
    validateCommit?: (commit: string) => void;
}

export interface ResolvedStaticAssetsConfig {
    root: string;
    bucket: string;
    region: string;
    commit: string;
    endpoint?: string;
    forcePathStyle: boolean;
    commitPrefix: string;
    sharedPrefix: string;
    targets: readonly StaticAssetTarget[];
    targetIds?: readonly string[];
    requiredTargetIds: readonly string[];
}

export interface UploadPlanEntry {
    targetId: string;
    localPath: string;
    remoteKey: string;
    contentType: string;
    cacheControl: string;
}

export interface UploadPlan {
    bucket: string;
    region: string;
    commit: string;
    entries: UploadPlanEntry[];
}

export interface UploadResult {
    uploadedByTarget: Record<string, number>;
    totalUploaded: number;
}

export type StaticAssetStoreClient = {
    send(command: unknown): Promise<unknown>;
};

export interface StaticAssetUploadOptions {
    dryRun?: boolean;
    client?: StaticAssetStoreClient;
    baseDir?: string;
}
