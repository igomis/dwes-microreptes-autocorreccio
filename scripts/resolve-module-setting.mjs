#!/usr/bin/env node
import process from 'node:process';

import { loadModuleConfig, moduleDefaultGroup, moduleGroupFiles } from './lib/module-config.mjs';

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : '';
}

const args = process.argv.slice(2);
const group = valueAfter(args, '--group') || 'all';
const field = valueAfter(args, '--field');
const config = loadModuleConfig();
const groupFiles = moduleGroupFiles(config);

if (!Object.hasOwn(groupFiles, group)) {
  throw new Error(`Grup no vàlid: ${group}`);
}

if (field === 'repositories_file') {
  process.stdout.write(groupFiles[group]);
} else if (field === 'default_group') {
  process.stdout.write(group === 'all' ? moduleDefaultGroup(config) : group);
} else {
  throw new Error('Usa --field repositories_file o --field default_group');
}
