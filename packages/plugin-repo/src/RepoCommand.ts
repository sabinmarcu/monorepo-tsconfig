import path from 'path';
import fs from 'fs';
import { Command } from 'clipanion';
import { root } from '@tscmono/utils';
import merge from 'ts-deepmerge';
import { repoConfig } from './config';
import { generateTsConfigs } from './tree';

export const commandPath = ['generate', 'repo'];

/**
 * Command used to generate all repo tsconfigs
 */
export class RepoTSCMonoCommand extends Command {
  @Command.Path(...commandPath)
  async execute() {
    const rootDir = await root.value;
    const list = await generateTsConfigs();
    const config = await repoConfig.value;
    const rootExtra = {
      extends: path.resolve(rootDir, config.baseConfig),
    };
    list.forEach(
      ({ path: p, isRoot, content }) => {
        const conf = isRoot
          ? merge(content, rootExtra)
          : content;
        fs.writeFileSync(
          p,
          JSON.stringify(conf, undefined, 2),
        );
      },
    );
  }
}
