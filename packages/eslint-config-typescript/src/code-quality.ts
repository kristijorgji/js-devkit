import type { ESLint, Linter } from 'eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';

export interface CodeQualityOptions {
  /** sonarjs in-file duplication subset. Cross-file clones are jscpd's job. */
  duplication?: boolean;
  /** unused-imports/no-unused-imports + @typescript-eslint/no-unused-private-class-members. */
  unusedSymbols?: boolean;
}

export const defaultCodeQualityOptions: Required<CodeQualityOptions> = {
  duplication: true,
  unusedSymbols: true,
};

function resolveOptions(
  setting?: boolean | CodeQualityOptions
): Required<CodeQualityOptions> | null {
  if (setting === undefined || setting === false) {
    return null;
  }
  if (setting === true) {
    return { ...defaultCodeQualityOptions };
  }
  return {
    ...defaultCodeQualityOptions,
    ...setting,
  };
}

/** Plugin registrations for the codeQuality group; empty when fully disabled. */
export function codeQualityPlugins(
  setting?: boolean | CodeQualityOptions
): Record<string, ESLint.Plugin> {
  const options = resolveOptions(setting);
  if (!options) {
    return {};
  }

  const plugins: Record<string, ESLint.Plugin> = {};
  if (options.duplication) {
    plugins.sonarjs = sonarjs as ESLint.Plugin;
  }
  if (options.unusedSymbols) {
    plugins['unused-imports'] = unusedImports as ESLint.Plugin;
  }
  return plugins;
}

export function codeQualityRules(setting?: boolean | CodeQualityOptions): Linter.RulesRecord {
  const options = resolveOptions(setting);
  if (!options) {
    return {};
  }

  const rules: Linter.RulesRecord = {};

  if (options.duplication) {
    rules['sonarjs/no-identical-functions'] = 'error';
    rules['sonarjs/no-duplicated-branches'] = 'error';
    rules['sonarjs/no-all-duplicated-branches'] = 'error';
    rules['sonarjs/no-identical-conditions'] = 'error';
    rules['sonarjs/no-identical-expressions'] = 'error';
  }

  if (options.unusedSymbols) {
    rules['unused-imports/no-unused-imports'] = 'error';
    rules['@typescript-eslint/no-unused-private-class-members'] = 'error';
  }

  return rules;
}

/**
 * Standalone flat-config block for the codeQuality group. Use when composing
 * without `createTypescriptConfig` (for example a React Native preset).
 */
export function createCodeQualityConfig(setting: boolean | CodeQualityOptions = true): Linter.Config {
  return {
    files: ['**/*.{ts,tsx}'],
    plugins: codeQualityPlugins(setting),
    rules: codeQualityRules(setting),
  };
}
