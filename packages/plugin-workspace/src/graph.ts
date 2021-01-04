import path from 'path';
import {
  makeLogger,
  root,
  workspaces,
} from '@tscmono/utils';
import {
  repoConfig,
} from '@tscmono/plugin-repo';
import merge from 'ts-deepmerge';

// @ts-ignore
import { WorkspaceRootConfig } from '@tscmono/config/types/root';
import { WorkspaceConfig } from '@tscmono/utils/src/types/WorkspaceConfig';
import template from './template.json';
import { getConfig } from './config';

/**
 * @ignore
 */
const debug = makeLogger(__filename);

/**
 * Describe what should be written to the filesystem for a tsconfig
 */
type TSConfigTemplate = {
  /**
   * The path of the file to be writte
   */
  path: string,
  /**
   * The content to be written
   */
  content: any & { references: {path: string}[] },
};

export const normalizePath = (
  rootPath: string,
  pkgRootPath: string,
  pathToResolve: string,
) => {
  const basePath = path.resolve(rootPath, pathToResolve);
  const newPath = path.relative(
    pkgRootPath,
    basePath,
  );
  if (newPath[0] !== '.') {
    return `./${newPath}`;
  }
  return newPath;
};

export const packageToTsConfig = async (
  pkg: WorkspaceConfig,
  rootConfig: WorkspaceRootConfig,
  rootDir: string,
  tpl: any,
  pkgList: Record<string, WorkspaceConfig>,
): Promise<TSConfigTemplate> => {
  const pkgPath = path.resolve(
    rootDir,
    pkg.location,
  );
  const rootExtra = {
    extends: normalizePath(
      rootDir,
      pkgPath,
      rootConfig.baseConfig,
    ),
  };
  const tsConfigPath = path.resolve(
    pkgPath,
    'tsconfig.json',
  );
  const conf = await getConfig(pkgPath);
  let extendedConf: any;
  if (conf.preset) {
    extendedConf = rootConfig.presets?.[conf.preset as string] ?? undefined;
  } else if (conf.presets) {
    extendedConf = (conf.presets as string[]).reduce(
      (prev: any, it: string) => merge(
        prev,
        rootConfig.presets?.[it] ?? undefined,
      ),
      {},
    );
  } else if (conf.extends) {
    extendedConf = {
      extends: conf.extends as string,
    };
  }
  const references = pkg.workspaceDependencies
    .map((it) => path.resolve(rootDir, pkgList[it].location))
    .map((location) => ({
      path: path.relative(pkgPath, location),
    }));
  return {
    path: tsConfigPath,
    content: merge(
      rootExtra,
      tpl,
      conf.overrides || {},
      extendedConf,
      { references },
    ),
  };
};

/**
 * Generate [[TSConfigTemplate]]s for all repo paths
 * @param rootDir The root directory to be used when generating tsConfigs
 * @category TSConfig Generation
 */
export const generateTsConfigs = async (
  rootDir: string = process.cwd(),
) => {
  debug('Starting tsconfigs generation');
  const workspaceRoot = rootDir
    ? await root.refresh(rootDir)
    : await root.value;
  const packages = rootDir
    ? await workspaces.refresh(rootDir)
    : await workspaces.value;
  const rootConfig: WorkspaceRootConfig = rootDir
    ? await repoConfig.refresh(rootDir)
    : await repoConfig.value;
  return Promise.all(
    Object.values(packages).map(
      (pkg) => packageToTsConfig(
        pkg,
        rootConfig,
        workspaceRoot,
        template,
        packages,
      ),
    ),
  );
};
