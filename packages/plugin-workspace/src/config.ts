import { loadConfig, JSONSchema } from '@tscmono/config';
import workspaceSchema from '@tscmono/config/schemas/workspace.json';
import type { WorkspaceConfig } from '@tscmono/config/types/workspace';

/**
 * Obtain the monorepo `tscmono` config using cosmiconfig
 * @param rootDir Optional directory from which to obtain the repo config
 * @category Config
 */
export const getConfig = (
  rootDir: string = process.cwd(),
) => loadConfig<WorkspaceConfig>(
  workspaceSchema as JSONSchema,
  'tscmono',
  rootDir,
);
