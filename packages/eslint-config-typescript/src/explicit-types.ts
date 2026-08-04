import type { Linter } from 'eslint';

export interface ExplicitTypesOptions {
  /** Prefer `: T = {…}` over `{…} as T` on object/array literals. */
  typeAssertions?: boolean;
  /** Prefer `import type` with inline fix style. */
  typeImports?: boolean;
  /** Exported functions and public methods declare parameter and return types. */
  moduleBoundaryTypes?: boolean;
  /** Internal functions declare return types. Noisy in `.tsx`; pass `false` there. */
  functionReturnType?: boolean;
}

export const defaultExplicitTypesOptions: Required<ExplicitTypesOptions> = {
  typeAssertions: true,
  typeImports: true,
  moduleBoundaryTypes: true,
  functionReturnType: true,
};

/** Shared option objects for the explicitTypes group. */
export const consistentTypeAssertionsOptions = {
  assertionStyle: 'as' as const,
  objectLiteralTypeAssertions: 'never' as const,
  arrayLiteralTypeAssertions: 'never' as const,
};

export const consistentTypeImportsOptions = {
  prefer: 'type-imports' as const,
  fixStyle: 'inline-type-imports' as const,
  disallowTypeAnnotations: true,
};

export const explicitFunctionReturnTypeOptions = {
  allowExpressions: true,
  allowTypedFunctionExpressions: true,
  allowHigherOrderFunctions: true,
};

function resolveOptions(
  setting?: boolean | ExplicitTypesOptions
): Required<ExplicitTypesOptions> | null {
  if (setting === undefined || setting === false) {
    return null;
  }
  if (setting === true) {
    return { ...defaultExplicitTypesOptions };
  }
  return {
    ...defaultExplicitTypesOptions,
    ...setting,
  };
}

export function explicitTypesRules(setting?: boolean | ExplicitTypesOptions): Linter.RulesRecord {
  const options = resolveOptions(setting);
  if (!options) {
    return {};
  }

  const rules: Linter.RulesRecord = {};

  if (options.typeAssertions) {
    rules['@typescript-eslint/consistent-type-assertions'] = [
      'error',
      consistentTypeAssertionsOptions,
    ];
  }

  if (options.typeImports) {
    rules['@typescript-eslint/consistent-type-imports'] = ['error', consistentTypeImportsOptions];
  }

  if (options.moduleBoundaryTypes) {
    rules['@typescript-eslint/explicit-module-boundary-types'] = 'error';
  }

  if (options.functionReturnType) {
    rules['@typescript-eslint/explicit-function-return-type'] = [
      'error',
      explicitFunctionReturnTypeOptions,
    ];
  }

  return rules;
}

/**
 * Standalone flat-config block for the explicitTypes group. Use when composing
 * without `createTypescriptConfig` (for example a React Native preset).
 */
export function createExplicitTypesConfig(
  setting: boolean | ExplicitTypesOptions = true
): Linter.Config {
  return {
    files: ['**/*.{ts,tsx}'],
    rules: explicitTypesRules(setting),
  };
}
