import type { Linter } from 'eslint';

declare module 'eslint-plugin-react-x' {
  const plugin: {
    configs: {
      'recommended-typescript': { rules: Linter.RulesRecord };
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-react-dom' {
  const plugin: {
    configs: {
      recommended: { rules: Linter.RulesRecord };
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-storybook' {
  const plugin: {
    configs: {
      'flat/recommended': Linter.Config[];
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-jsx-a11y' {
  const plugin: {
    flatConfigs: {
      recommended: { rules: Linter.RulesRecord };
    };
  };
  export default plugin;
}

declare module '@next/eslint-plugin-next' {
  const plugin: {
    configs: {
      recommended: { rules: Linter.RulesRecord };
      'core-web-vitals': { rules: Linter.RulesRecord };
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-react' {
  const plugin: {
    configs: {
      flat: {
        recommended: { rules: Linter.RulesRecord };
        'jsx-runtime': { rules: Linter.RulesRecord };
      };
    };
  };
  export default plugin;
}

declare module 'eslint-plugin-perfectionist' {
  import type { ESLint } from 'eslint';
  const plugin: ESLint.Plugin;
  export default plugin;
}
