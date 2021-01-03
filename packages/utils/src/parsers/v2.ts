import path from 'path';
import { execPromised } from '../execPromised';
import { root } from '../findRoot';
import { makeLogger } from '../logger';
import { getPackageJson } from '../package';
import { WorkspacesConfig, YarnV2WorkspaceConfig, WorkspaceConfig } from '../types/WorkspaceConfig';
import { WorkspaceParser } from '../types/WorkspaceParser';

/**
 * @ignore
 */
const debug = makeLogger(__filename);

/**
 * Fixes Yarn V2 Output to conform to V1 Standards
 * @param pwd Root path
 * @param p Package path
 * @category Util
 */
export const fixV2Path = (
  pwd: string,
  p: string,
) => getPackageJson(
  path.resolve(pwd, p),
).name;

/**
 * Yarn V2 Workspace List Parser
 * @category Yarn Workspace Parsers
 */
export const YarnV2Parser: WorkspaceParser = {
  call: (cwd) => {
    const cmd = 'yarn workspaces list -v --json';
    debug('Discovering Yarn Berry Workspaces');
    return execPromised(
      cmd,
      { cwd },
    );
  },
  parse: async (
    input,
    pwd,
  ) => {
    debug('Parsing Output');
    const boundFixV2Path = fixV2Path.bind(undefined, pwd);
    const pkg = getPackageJson(await root.value);
    const output = input.join(',');
    const packages = (JSON.parse(`[${output.substr(0, output.length - 1)}]`)) as YarnV2WorkspaceConfig[];
    debug('Ignoring Root Package: %s', pkg.name);
    const validPackages = packages.filter(({ name }) => name !== pkg.name);
    const json = validPackages.reduce(
      (prev, {
        name,
        workspaceDependencies,
        mismatchedWorkspaceDependencies,
        ...rest
      }: YarnV2WorkspaceConfig) => ({
        ...prev,
        [name]: {
          ...rest,
          workspaceDependencies: (workspaceDependencies || [])
            .map(boundFixV2Path),
          mismatchedWorkspaceDependencies: (mismatchedWorkspaceDependencies || [])
            .map(boundFixV2Path),
        } as WorkspaceConfig,
      }),
      {} as WorkspacesConfig,
    );
    return json;
  },
};

export default YarnV2Parser;
