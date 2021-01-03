import fs from 'fs';
import path from 'path';

/**
 * Load a `package.json` file from a path
 * @param pwd The path
 * @category Util
 */
export const getPackageJson = (pwd: string) => JSON.parse(
  fs.readFileSync(
    path.resolve(
      pwd.replace(/\/package\.json$/, ''),
      'package.json',
    ),
    'utf-8',
  ),
);

/**
 * Determine if path contains a `package.json` file
 * @param pwd Path
 * @category Util
 */
export const hasPackageJson = (pwd: string) => fs.existsSync(
  path.resolve(pwd, 'package.json'),
);

/**
 * Find a directory containing a package.json file, crawling from the
 * starting path, and moving towards the OS root dir, using [[hasPackageJson]]
 * @param pwd Starting point for finding a package.json
 * @param prev Previous visited directory (used for determining OS root dir)
 * @category Util
 */
export const findPackageJson = (
  pwd: string,
  prev?: string,
): string => {
  if (prev && prev === pwd) {
    throw new Error('Reached root folder');
  }
  if (hasPackageJson(pwd)) {
    return pwd;
  }
  return findPackageJson(path.dirname(pwd), pwd);
};
