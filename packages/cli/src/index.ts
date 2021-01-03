import path from 'path';
import { Cli, Command } from 'clipanion';
import { getPackageJson } from '@tscmono/utils';
import { BaseCommand } from './BaseCommand';
import { plugins } from './plugins';

const pkg = getPackageJson(
  path.resolve(__dirname, '../'),
);

export const run = async (args: string[]) => {
  const ownPlugins = await plugins.value;
  const cli = new Cli({
    binaryLabel: 'TSCMono',
    binaryName: 'tscmono',
    binaryVersion: pkg.version,
  });
  cli.register(Command.Entries.Help);
  cli.register(Command.Entries.Version);
  cli.register(BaseCommand);
  ownPlugins.filter((it) => it.commands)
    .forEach(({ commands }) => {
      commands.forEach((command: any) => cli.register(command));
    });
  cli.runExit(args, {
    ...Cli.defaultContext,
  });
};

if (require.main?.filename === __filename) {
  run(process.argv.slice(2));
}
