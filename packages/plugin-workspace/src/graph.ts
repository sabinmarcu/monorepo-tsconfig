import path from 'path';
import {
  makeLogger,
  parseWorkspaces,
  pathsToTree,
  registerCache,
  root,
  TreeNode,
} from '@tscmono/utils';
import merge from 'ts-deepmerge';

// @ts-ignore
import template from './template.json';

/**
 * @ignore
 */
const debug = makeLogger(__filename);

/**
 * Create a project tree based on workspaces
 * @param rootDir The root directory used in creating the project tree
 */
export const getTree = async (
  rootDir: string = process.cwd(),
) => {
  debug(`Starting tree parsing at ${rootDir}`);
  const projectRoot = await root.value;
  debug(`Found project root at ${projectRoot}`);
  const workspaces = await parseWorkspaces(projectRoot);
  const paths = Object.values(workspaces)
    .map(({ location }) => location);
  debug('Obtained paths', paths);
  const tree = pathsToTree(paths);
  return {
    projectRoot,
    tree,
  };
};

/**
 * Cached version of the [[getTree | Workspace Tree Generator]] function
 * @category Cache
 */
export const workspaceTree = registerCache(
  'workspaceTree',
  getTree,
);

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
  /**
   * Used to decide if the `baseConfig` should be added as `extends`
   */
  isRoot: boolean,
};

/**
 * Convert a single [[TreeNode]] instance to a [[TSConfigTemplate]], given the
 * project path, and a template to be used. It will only generate the template for
 * the current node, and not traverse its children
 * @param projectPath The project path
 * @param tree The tree to be converted
 * @param tpl The template to be used
 * @category TSConfig Generation
 */
export const treeNodeToTSConfig = (
  projectPath: string,
  tree: TreeNode,
  tpl: any,
): TSConfigTemplate => ({
  path: path.resolve(projectPath, tree.path, 'tsconfig.json'),
  isRoot: tree.path === '',
  content: merge(
    tpl,
    {
      references: Object.values(tree.children).map(
        (node) => (typeof node === 'string'
          ? path.resolve(projectPath, node)
          : path.resolve(projectPath, node.path)),
      ).map((it) => ({ path: it })),
    },
  ),
});

/**
 * Reduce an entire [[TreeNode]] to an array of [[TSConfigTemplate]]s, using
 * the [[treeNodeToTSConfig]] function to convert a single node to template,
 * traversing the [[TreeNode.children]] to generate the [[TSConfigTemplate]] array
 * @param projectPath
 * @param tree
 * @param tpl
 * @category TSConfig Generation
 */
export const reduceTreeNodeToTSConfigList = (
  projectPath: string,
  tree: TreeNode,
  tpl: any,
): TSConfigTemplate[] | undefined => {
  const currentTemplate = treeNodeToTSConfig(projectPath, tree, tpl);
  const childTemplates = Object.values(tree.children).map(
    (child) => {
      if (typeof child === 'string') {
        return undefined;
      }
      return reduceTreeNodeToTSConfigList(projectPath, child, tpl);
    },
  ).flat().filter(Boolean) as TSConfigTemplate[];
  return [
    currentTemplate,
    ...childTemplates,
  ];
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
  const tree = rootDir
    ? await workspaceTree.refresh(rootDir)
    : await workspaceTree.value;
  debug('Generated workspace tree');
  const tsConfigs = reduceTreeNodeToTSConfigList(
    tree.projectRoot,
    tree.tree,
    template,
  ) as TSConfigTemplate[];
  return tsConfigs;
};
