/* eslint-disable import/prefer-default-export */
import path from 'path';
import fs from 'fs';
import { cosmiconfig } from 'cosmiconfig';
import { JSONSchema } from 'json-schema-to-typescript';
import { makeLogger, root } from '@tscmono/utils';
import { Validator } from 'jsonschema';
import { nanoid } from 'nanoid';

/**
 * @ignore
 */
const debug = makeLogger(__filename);

const resolveRef = (
  ref: string,
  rootDir: string,
) => {
  const paths = [
    path.resolve(__dirname, '../schemas', ref),
    path.resolve(rootDir, ref),
  ];
  return paths.filter((it) => fs.existsSync(it))?.[0] ?? undefined;
};

const getSubSchemas = (
  schema: Partial<JSONSchema>,
  rootDir: string,
): { path: string, schema: JSONSchema }[] => {
  if (!schema || typeof schema === 'string') {
    return [];
  }
  if (schema.$ref?.startsWith('.')) {
    const schemaPath = resolveRef(schema.$ref, rootDir);
    const id = `/${nanoid()}`;
    // eslint-disable-next-line no-param-reassign
    schema.$ref = id;
    return [{
      path: id,
      schema: {
        ...require(schemaPath),
        id,
      },
    }];
  }
  return Object.values(schema).map(
    (subSchema) => getSubSchemas(subSchema, rootDir),
  ).flat();
};

/**
 * Uses `cosmiconfig` to obtain configuration and then
 * match it against a JSON Schema to validate, and finally
 * resolve the configuration
 * @param schema The JSON Schema to match config against
 * @param rootDir The directory used to find the monorepo root
 * @param name The name of the config module name
 * @category Config
 */
export const loadConfig = async <T>(
  schema: JSONSchema,
  name: string,
  rootDir?: string,
): Promise<T> => {
  const repoRoot = rootDir || await root.value;
  debug(`Loading config for "${name}" from "${repoRoot}"`);
  const explorer = cosmiconfig(name);
  const output = await explorer.search(repoRoot);
  if (!output || output.isEmpty) {
    throw new Error(`Configuration for ${name} cannot be found!`); // TODO: Make this better
  }
  debug('Config found');
  const validator = new Validator();
  const subSchemas = getSubSchemas(schema, repoRoot)
    .filter(
      (it, idx, arr) => arr.findIndex(
        ({ path: p }) => p === it.path,
      ) === idx,
    );
  subSchemas.forEach(
    ({ path: p, schema: s }) => validator.addSchema({
      ...s,
      id: p,
    }, p),
  );
  const validateResult = validator.validate(output.config, schema);
  const isValid = validateResult.valid;
  if (!isValid) {
    throw new Error(`Configuration for ${name} is invalid! (at: "${output.filepath}")
    
${validateResult.errors.map(
    ({ property, message }) => `    ${property}: ${message}`,
  ).join('\n')}
    
    `);
  }
  debug('Config is valid, resolving');
  return output.config as T;
};
