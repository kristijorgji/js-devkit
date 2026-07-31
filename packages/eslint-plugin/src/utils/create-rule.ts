import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * Shared rule creator that links each rule's `docs.url` to its documentation page in
 * the js-devkit repository.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/kristijorgji/js-devkit/blob/main/docs/rules/${name}.md`,
);
