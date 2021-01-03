#!/usr/local/env node

require(
  require('path').resolve(__dirname, '../dist/index')
).run(process.argv.slice(2));
