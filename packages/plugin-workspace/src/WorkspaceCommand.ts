import fs from 'fs';
import { Command } from 'clipanion';
import { generateTsConfigs } from './graph';

export const commandPath = ['generate', 'workspace'];

/**
 * Command used to generate all workspaces tsconfigs
 */
export class WorkspaceTSCMonoCommand extends Command {
  @Command.Path(...commandPath)
  async execute() {
    const list = await generateTsConfigs();
    list.forEach(
      ({ path: p, content }) => {
        fs.writeFileSync(
          p,
          JSON.stringify(content, undefined, 2),
        );
      },
    );
  }
}
