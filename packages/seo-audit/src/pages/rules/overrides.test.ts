// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { indexableAudit } from '../__fixtures__/pages.js';

import { applyRuleOverrides } from './overrides.js';

describe('applyRuleOverrides', () => {
    it('leaves issues unchanged when overrides are empty', () => {
        const page = indexableAudit({
            issues: [{ ruleId: 'idx.single-h1', severity: 'warn', message: 'two' }],
        });
        applyRuleOverrides([page], {});
        expect(page.issues).toEqual([{ ruleId: 'idx.single-h1', severity: 'warn', message: 'two' }]);
    });

    it('removes issues whose override is off', () => {
        const page = indexableAudit({
            issues: [
                { ruleId: 'idx.single-h1', severity: 'warn', message: 'two' },
                { ruleId: 'idx.title-present', severity: 'error', message: 'missing' },
            ],
        });
        applyRuleOverrides([page], { 'idx.single-h1': 'off' });
        expect(page.issues).toEqual([{ ruleId: 'idx.title-present', severity: 'error', message: 'missing' }]);
    });

    it('changes severity when an override is set', () => {
        const page = indexableAudit({
            issues: [{ ruleId: 'idx.single-h1', severity: 'warn', message: 'two' }],
        });
        applyRuleOverrides([page], { 'idx.single-h1': 'error' });
        expect(page.issues).toEqual([{ ruleId: 'idx.single-h1', severity: 'error', message: 'two' }]);
    });
});
