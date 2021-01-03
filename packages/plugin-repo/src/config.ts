import { loadConfig, JSONSchema } from '@tscmono/config';
import repoSchema from '@tscmono/config/schemas/root.json';
import type { WorkspaceRootConfig } from '@tscmono/config/types/root';
import { registerCache } from '@tscmono/utils';

/**
 * Obtain the monorepo `tscmono` config using cosmiconfig
 * @param rootDir Optional directory from which to obtain the repo config
 * @category Config
 */
const getRepoConfig = (
  rootDir: string = process.cwd(),
) => loadConfig<WorkspaceRootConfig>(
  repoSchema as JSONSchema,
  'tscmono',
  rootDir,
);

/**
 * Cached version of the [[getRepoConfig | Get Repo Config]] function
 * @category Cache
 */
export const repoConfig = registerCache(
  'repoConfig',
  getRepoConfig,
);
