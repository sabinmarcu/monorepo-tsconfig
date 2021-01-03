import path from 'path';
import fs from 'fs';
import { Command } from 'clipanion';
import { root } from '@tscmono/utils';
import merge from 'ts-deepmerge';
import { repoConfig } from './config';
import { generateTsConfigs } from './tree';

export const commandPath = ['generate', 'repo'];

export const normalizePath = (
  rootPath: string,
  pathToResolve: string,
) => {
  const newPath = path.relative(
    rootPath,
    pathToResolve,
  );
  if (newPath[0] !== '.') {
    return `./${newPath}`;
  }
  return newPath;
};

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
      extends: normalizePath(rootDir, config.baseConfig),
    };
    list.forEach(
      ({ path: p, isRoot, content }) => {
        const conf = isRoot
          ? merge(content, rootExtra)
          : content;
        fs.writeFileSync(
          p,
          JSON.stringify({
            ...conf,
            references: conf.references.map(
              (
                { path: ref }: { path: string },
              ) => ({
                path: normalizePath(
                  path.dirname(p),
                  ref,
                ),
              }),
            ),
          }, undefined, 2),
        );
      },
    );
  }
}
