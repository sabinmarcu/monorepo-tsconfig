const path = require('path');
const fs = require('fs');
const glob = require('glob');

const rules = {
  'import/prefer-default-export': 0,
  'import/no-dynamic-require': 0,
  'global-require': 0,
};

const tsConfigs = glob.sync('**/tsconfig.json')
  .filter((config) => fs.existsSync(
    path.resolve(
      path.dirname(
        path.resolve(config),
      ),
      'package.json',
    ),
  ))
  .map((config) => path.relative(__dirname, config));

if (process.env.DEBUG) {
  console.log(tsConfigs);
}

module.exports = {
  extends: ['eslint-config-airbnb-base'],
  parserOptions: {
    project: tsConfigs,
  },
  rules,
  overrides: [
    {
      files: ['.eslintrc.js'],
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
    {
      files: ['*.ts'],
      extends: ['eslint-config-airbnb-typescript'],
      rules,
    },
    {
      files: ['*Command.ts'],
      rules: {
        'class-methods-use-this': 0,
      },
    },
  ],
};
