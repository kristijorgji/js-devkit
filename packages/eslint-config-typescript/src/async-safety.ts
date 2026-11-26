import type { Linter } from 'eslint';

export interface AsyncSafetyOptions {
  /** `@typescript-eslint/no-floating-promises`: await, return, `.catch` or mark `void`. */
  floatingPromises?: boolean;
  /** `@typescript-eslint/no-misused-promises`: no promises in conditionals, spreads or void callbacks. */
  misusedPromises?: boolean;
  /** With `misusedPromises`, also flag async handlers passed to JSX attributes. React factory default: false. */
  jsxAttributes?: boolean;
  /** `@typescript-eslint/await-thenable`. */
  awaitThenable?: boolean;
  /** `@typescript-eslint/switch-exhaustiveness-check` (a `default` branch counts as exhaustive). */
  switchExhaustiveness?: boolean;
}

export const defaultAsyncSafetyOptions: Required<AsyncSafetyOptions> = {
  floatingPromises: true,
  misusedPromises: true,
  jsxAttributes: true,
  awaitThenable: true,
  switchExhaustiveness: true,
};

export const switchExhaustivenessCheckOptions = {
  considerDefaultExhaustiveForUnions: true,
  requireDefaultForNonUnion: false,
  allowDefaultCaseForExhaustiveSwitch: true,
};

function resolveOptions(
  setting?: boolean | AsyncSafetyOptions
): Required<AsyncSafetyOptions> | null {
  if (setting === false) {
    return null;
  }
  if (setting === undefined || setting === true) {
    return { ...defaultAsyncSafetyOptions };
  }
  return { ...defaultAsyncSafetyOptions, ...setting };
}

/** Type-aware rules; only valid inside a block with parser services (see `createTypedLintConfig`). */
export function asyncSafetyRules(setting?: boolean | AsyncSafetyOptions): Linter.RulesRecord {
  const options = resolveOptions(setting);
  if (!options) {
    return {};
  }
  const rules: Linter.RulesRecord = {};
  if (options.floatingPromises) {
    rules['@typescript-eslint/no-floating-promises'] = 'error';
  }
  if (options.misusedPromises) {
    rules['@typescript-eslint/no-misused-promises'] = options.jsxAttributes
      ? 'error'
      : ['error', { checksVoidReturn: { attributes: false } }];
  }
  if (options.awaitThenable) {
    rules['@typescript-eslint/await-thenable'] = 'error';
  }
  if (options.switchExhaustiveness) {
    rules['@typescript-eslint/switch-exhaustiveness-check'] = [
      'error',
      switchExhaustivenessCheckOptions,
    ];
  }
  return rules;
}
