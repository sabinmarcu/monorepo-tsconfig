import { commandPath, WorkspaceTSCMonoCommand } from './WorkspaceCommand';

export * from './config';
export * from './graph';

export const commands = [
  WorkspaceTSCMonoCommand,
];

export const runOnDefault = true;
export const runOnDefaultPath = commandPath;
export const runOnDefaultPriority = 20;
