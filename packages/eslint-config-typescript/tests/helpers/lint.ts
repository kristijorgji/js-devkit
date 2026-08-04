import path from 'node:path';

import { ESLint, type Linter } from 'eslint';

/** Cache by config array identity (configs hold circular plugin refs). */
const eslintCache = new WeakMap<object, ESLint>();

export function createEslint(fixtureDir: string, overrideConfig: Linter.Config[]): ESLint {
  const cached = eslintCache.get(overrideConfig);
  if (cached) {
    return cached;
  }

  const eslint = new ESLint({
    cwd: fixtureDir,
    overrideConfigFile: true,
    overrideConfig,
  });
  eslintCache.set(overrideConfig, eslint);
  return eslint;
}

export function ruleSeverity(entry: Linter.RuleEntry | undefined): number | undefined {
  if (entry === undefined) {
    return undefined;
  }
  const severity = Array.isArray(entry) ? entry[0] : entry;
  if (severity === 'error') {
    return 2;
  }
  if (severity === 'warn') {
    return 1;
  }
  if (severity === 'off') {
    return 0;
  }
  return typeof severity === 'number' ? severity : undefined;
}

export async function effectiveRules(
  overrideConfig: Linter.Config[],
  fixtureDir: string,
  file: string
): Promise<Partial<Linter.RulesRecord>> {
  const eslint = createEslint(fixtureDir, overrideConfig);
  const config = await eslint.calculateConfigForFile(path.join(fixtureDir, file));
  return (config.rules ?? {}) as Partial<Linter.RulesRecord>;
}

/** Rule IDs reported when linting a fixture file on disk. */
export async function reportedRuleIds(
  overrideConfig: Linter.Config[],
  fixtureDir: string,
  file: string
): Promise<string[]> {
  const eslint = createEslint(fixtureDir, overrideConfig);
  const results = await eslint.lintFiles([path.join(fixtureDir, file)]);
  return results
    .flatMap((r) => r.messages.map((m) => m.ruleId))
    .filter((id): id is string => Boolean(id));
}

/** Lint text at a virtual path under the fixture dir; return reported rule IDs. */
export async function reportedRuleIdsForText(
  overrideConfig: Linter.Config[],
  fixtureDir: string,
  file: string,
  code: string
): Promise<string[]> {
  const eslint = createEslint(fixtureDir, overrideConfig);
  const results = await eslint.lintText(code, { filePath: path.join(fixtureDir, file) });
  return results
    .flatMap((r) => r.messages.map((m) => m.ruleId))
    .filter((id): id is string => Boolean(id));
}

/** Messages for a lintText/lintFiles run (for severity checks). */
export async function lintMessages(
  overrideConfig: Linter.Config[],
  fixtureDir: string,
  file: string,
  code?: string
): Promise<Linter.LintMessage[]> {
  const eslint = createEslint(fixtureDir, overrideConfig);
  const filePath = path.join(fixtureDir, file);
  const results = code
    ? await eslint.lintText(code, { filePath })
    : await eslint.lintFiles([filePath]);
  return results.flatMap((r) => r.messages);
}

/** Rule IDs with severity > 0, sorted — for the inventory snapshot. */
export function enabledRuleIds(rules: Partial<Linter.RulesRecord>): string[] {
  return Object.entries(rules)
    .filter(([, entry]) => {
      const severity = ruleSeverity(entry);
      return severity !== undefined && severity > 0;
    })
    .map(([id]) => id)
    .sort();
}

/** Group enabled rule IDs by plugin prefix for readable snapshots. */
export function enabledRulesByPrefix(rules: Partial<Linter.RulesRecord>): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const id of enabledRuleIds(rules)) {
    const prefix = id.includes('/') ? id.split('/')[0]! : 'core';
    grouped[prefix] ??= [];
    grouped[prefix]!.push(id);
  }
  return Object.fromEntries(Object.keys(grouped).sort().map((k) => [k, grouped[k]!]));
}

export async function fixedSource(
  overrideConfig: Linter.Config[],
  fixtureDir: string,
  file: string,
  code: string
): Promise<string> {
  const eslint = new ESLint({
    cwd: fixtureDir,
    overrideConfigFile: true,
    overrideConfig,
    fix: true,
  });
  const results = await eslint.lintText(code, { filePath: path.join(fixtureDir, file) });
  return results[0]?.output ?? code;
}
