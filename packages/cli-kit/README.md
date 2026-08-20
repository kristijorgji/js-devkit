# @kristijorgji/cli-kit

Shared CLI primitives for `@kristijorgji` tooling: a pino-pretty logger, a table printer, and a `spawnSync` wrapper.

## Install

```bash
pnpm add -D @kristijorgji/cli-kit
```

## Usage

```ts
import { cliLogger, cliTable, logFatalAndExit, runCommand } from '@kristijorgji/cli-kit';

cliLogger.info('starting');
cliTable([{ Name: 'framework', SizeKB: 58 }]);
runCommand('pnpm', ['exec', 'size-limit'], { cwd: process.cwd() });
logFatalAndExit('unrecoverable');
```

## License

MIT
