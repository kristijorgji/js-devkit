import type { Linter } from 'eslint';
import perfectionist from 'eslint-plugin-perfectionist';

export interface SortJsxPropsCustomGroup {
  groupName: string;
  elementNamePattern?: string;
}

export interface SortJsxPropsOptions {
  type?: 'alphabetical' | 'natural' | 'line-length' | 'unsorted';
  order?: 'asc' | 'desc';
  ignoreCase?: boolean;
  groups?: (string | string[])[];
  customGroups?: SortJsxPropsCustomGroup[];
  partitionByNewLine?: boolean;
}

/** JSX prop order: ranked identity props first, then unknown props, callbacks last. */
export const defaultJsxPropsOptions: SortJsxPropsOptions = {
  type: 'alphabetical',
  order: 'asc',
  ignoreCase: true,
  groups: ['testid', 'key', 'ref', 'id', 'name', 'unknown', 'callback'],
  customGroups: [
    { groupName: 'testid', elementNamePattern: '^(data-testid|testID)$' },
    { groupName: 'key', elementNamePattern: '^key$' },
    { groupName: 'ref', elementNamePattern: '^ref$' },
    { groupName: 'id', elementNamePattern: '^id$' },
    { groupName: 'name', elementNamePattern: '^name$' },
    { groupName: 'callback', elementNamePattern: '^on.+' },
  ],
};

/**
 * Standalone flat-config block for JSX prop order. Exported so consumers with their
 * own React preset (for example React Native) can compose it without the full factory.
 * Top-level option keys shallow-merge over {@link defaultJsxPropsOptions} (arrays replace).
 */
export function createJsxPropsConfig(options?: SortJsxPropsOptions): Linter.Config {
  return {
    files: ['**/*.{ts,tsx}'],
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-jsx-props': [
        'error',
        {
          ...defaultJsxPropsOptions,
          ...options,
        },
      ],
    },
  };
}
