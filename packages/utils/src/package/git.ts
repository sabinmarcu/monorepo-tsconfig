import { execPromised } from '../execPromised';
import { WorkspaceRootFinder } from '../types/WorkspaceRoot';

/**
 * Determines the root of a project based on git
 * @param root The root directory to start searching from
 * @category Workspace Root Finder
 */
export const findWithGit: WorkspaceRootFinder['find'] = async (
  root: string = __dirname,
) => (await execPromised(
  'git rev-parse --show-toplevel',
  { cwd: root },
)).join('');

export default findWithGit;

if (require.main?.filename === __filename) {
  // eslint-disable-next-line no-console
  findWithGit().then((data) => console.log(data));
}
