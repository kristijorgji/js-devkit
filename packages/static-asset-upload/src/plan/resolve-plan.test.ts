import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { StaticAssetsConfig } from '../config/types.js';

import { assertRequiredTargets, resolveUploadPlan } from './resolve-plan.js';

function writeSyntheticTree(root: string): void {
    mkdirSync(join(root, 'dist/static/chunks'), { recursive: true });
    writeFileSync(join(root, 'dist/static/chunks/app.js'), 'console.log("app")');
    mkdirSync(join(root, 'public'), { recursive: true });
    writeFileSync(join(root, 'public/icon.png'), 'png');
    writeFileSync(join(root, 'public/sw.js'), 'sw');
}

function syntheticConfig(root: string, overrides: Partial<StaticAssetsConfig> = {}): StaticAssetsConfig {
    return {
        root,
        bucket: 'test-bucket',
        commit: 'deadbeef',
        commitPrefix: 'assets/{commit}',
        sharedPrefix: 'assets/shared',
        targets: [
            {
                id: 'hashed-static',
                localDir: 'dist/static',
                remotePrefix: '{commitPrefix}/static',
                versioning: 'commit',
                cacheControl: 'public, max-age=31536000, immutable',
            },
            {
                id: 'public-icons',
                localDir: 'public',
                remotePrefix: '{sharedPrefix}',
                versioning: 'shared',
                cacheControl: 'public, max-age=10800',
                include: ['icon.png'],
                exclude: ['sw.js'],
            },
            {
                id: 'optional-fonts',
                localDir: 'public/fonts',
                remotePrefix: '{sharedPrefix}/fonts',
                versioning: 'shared',
                cacheControl: 'public, max-age=31536000, immutable',
                optional: true,
            },
        ],
        ...overrides,
    };
}

describe('resolveUploadPlan', () => {
    it('maps a synthetic tree to commit and shared remote keys', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-'));
        writeSyntheticTree(root);
        try {
            const plan = resolveUploadPlan(syntheticConfig(root));
            const keys = plan.entries.map((entry) => entry.remoteKey).sort();
            expect(keys).toEqual(['assets/deadbeef/static/chunks/app.js', 'assets/shared/icon.png']);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('applies caller-supplied cache-control per target', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-cache-'));
        writeSyntheticTree(root);
        try {
            const plan = resolveUploadPlan(syntheticConfig(root));
            const staticEntry = plan.entries.find((entry) => entry.targetId === 'hashed-static');
            const iconEntry = plan.entries.find((entry) => entry.targetId === 'public-icons');
            expect(staticEntry?.cacheControl).toBe('public, max-age=31536000, immutable');
            expect(iconEntry?.cacheControl).toBe('public, max-age=10800');
            expect(staticEntry?.contentType).toBe('application/javascript');
            expect(iconEntry?.contentType).toBe('image/png');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('limits the plan to requested target ids', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-filter-'));
        writeSyntheticTree(root);
        try {
            const plan = resolveUploadPlan(syntheticConfig(root, { targetIds: ['public-icons'] }));
            expect(plan.entries).toHaveLength(1);
            expect(plan.entries[0]?.remoteKey).toBe('assets/shared/icon.png');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('skips optional missing directories', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-optional-'));
        writeSyntheticTree(root);
        try {
            const plan = resolveUploadPlan(syntheticConfig(root, { targetIds: ['optional-fonts'] }));
            expect(plan.entries).toEqual([]);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('throws when a required directory is missing', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-missing-'));
        try {
            expect(() => resolveUploadPlan(syntheticConfig(root, { targetIds: ['hashed-static'] }))).toThrow(
                /Missing required directory/,
            );
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('assertRequiredTargets', () => {
    it('throws when a required target produced no files', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-require-missing-'));
        try {
            const config = syntheticConfig(root, {
                targetIds: ['optional-fonts'],
                requiredTargetIds: ['optional-fonts'],
            });
            const plan = resolveUploadPlan(config);
            expect(() => assertRequiredTargets(plan, config)).toThrow(
                'Required upload target "optional-fonts" produced no files',
            );
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('accepts a required target when files exist', () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-plan-require-present-'));
        writeSyntheticTree(root);
        try {
            const config = syntheticConfig(root, { requiredTargetIds: ['hashed-static'] });
            const plan = resolveUploadPlan(config);
            expect(() => assertRequiredTargets(plan, config)).not.toThrow();
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('throws for an unknown required target id', () => {
        expect(() => {
            assertRequiredTargets(
                { bucket: 'test-bucket', region: 'us-east-1', commit: 'deadbeef', entries: [] },
                syntheticConfig('/tmp/unused', { requiredTargetIds: ['not-a-target'] }),
            );
        }).toThrow('Unknown required upload target: not-a-target');
    });
});
