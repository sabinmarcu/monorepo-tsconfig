import { commandPath, RepoTSCMonoCommand } from './RepoCommand';

export * from './config';
export * from './tree';

export const commands = [
  RepoTSCMonoCommand,
];

export const runOnDefault = true;
export const runOnDefaultPath = commandPath;
export const runOnDefaultPriority = 10;
