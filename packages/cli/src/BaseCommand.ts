import { Command } from 'clipanion';
import { plugins } from './plugins';

export class BaseCommand extends Command {
  @Command.Path('generate')
  @Command.Path()
  async execute() {
    const ownPlugins = await plugins.value;
    return ownPlugins
      .filter((plugin) => plugin.runOnDefault)
      .sort(({ runOnDefaultPriority: a }, { runOnDefaultPriority: b }) => Math.sign(a - b))
      .map((plugin) => this.cli.run(plugin.runOnDefaultPath))
      .reduce((
        prev: Promise<number>,
        it: Promise<number>,
      ) => prev.then(() => it), Promise.resolve(-1));
  }
}
