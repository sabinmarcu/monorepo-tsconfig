import {
  root,
  findRoot,
  getPackageJson,
  makeLogger,
  registerCache,
} from '@tscmono/utils';

const debug = makeLogger(__filename);

export const getPlugins = async (
  rootDir: string = process.cwd(),
) => {
  const pwd = rootDir
    ? await findRoot(rootDir)
    : await root.value;

  const pkg = getPackageJson(pwd);
  debug('Loaded package.json');

  const deps = [
    'dependencies',
    'devDependencies',
  ]
    .map((it) => pkg[it] || {})
    .map((it) => Object.keys(it))
    .flat()
    .sort()
    .filter((it, idx, arr) => arr.indexOf(it) === idx);
  debug('Extracted deps (%d)', deps.length);

  const plugins = deps
    .filter((it) => /@?tscmono[/-]plugin-/g.test(it));

  debug('Extracted plugins', plugins);

  return plugins.map((it) => require(
    require.resolve(it, { paths: [pwd] }),
  ));
};

export const plugins = registerCache(
  'plugins',
  getPlugins,
);
