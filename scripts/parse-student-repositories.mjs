#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadModuleConfig } from './lib/module-config.mjs';

const moduleConfig = loadModuleConfig();

function groupMap(groups = Object.keys(moduleConfig.groups)) {
  return new Map(groups.map((group) => [group.toLowerCase(), group]));
}

function parseArgs(argv) {
  const args = {};
  const allowed = new Set(['--input', '--file', '--default-group']);

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (allowed.has(key) && value && !value.startsWith('--')) {
      args[key.slice(2)] = value;
      index += 1;
    }
  }

  return args;
}

function stripComment(line) {
  return line.replace(/#.*$/, '');
}

function normalizeRepo(token) {
  let repo = token.trim().replace(/^['"]|['"]$/g, '');

  repo = repo.replace(/^https?:\/\/github\.com\//i, '');
  repo = repo.replace(/^git@github\.com:/i, '');
  repo = repo.replace(/\.git$/i, '');
  repo = repo.replace(/^\/+|\/+$/g, '');

  return repo;
}

function isGroup(token, configuredGroups) {
  return configuredGroups.has(token.trim().toLowerCase());
}

function normalizeGroup(token, configuredGroups) {
  return configuredGroups.get(String(token || '').trim().toLowerCase()) || '';
}

function isRepo(token) {
  const repo = normalizeRepo(token);
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function tokenizeLine(line) {
  return stripComment(line)
    .replace(/[,;]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function parseRepositories(text, defaultGroup, groups = Object.keys(moduleConfig.groups)) {
  const configuredGroups = groupMap(groups);
  const normalizedDefaultGroup = normalizeGroup(defaultGroup, configuredGroups);
  if (!normalizedDefaultGroup) throw new Error(`Grup per defecte no configurat: ${defaultGroup}`);
  const rows = [];
  const seen = new Set();

  for (const rawLine of text.split(/\r?\n/)) {
    const tokens = tokenizeLine(rawLine);

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];

      if (!isRepo(token)) {
        throw new Error(`Entrada de repositori no valida: ${token}`);
      }

      const repo = normalizeRepo(token);
      const next = tokens[index + 1] || '';
      const group = isGroup(next, configuredGroups) ? normalizeGroup(next, configuredGroups) : normalizedDefaultGroup;

      if (isGroup(next, configuredGroups)) {
        index += 1;
      }

      const key = `${repo} ${group}`;
      if (!seen.has(key)) {
        rows.push({ repo, group });
        seen.add(key);
      }
    }
  }

  return rows.sort((a, b) => `${a.repo} ${a.group}`.localeCompare(`${b.repo} ${b.group}`));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configuredGroups = groupMap();
  const defaultGroup = normalizeGroup(args['default-group'], configuredGroups);

  if (!defaultGroup) {
    throw new Error('Falta --default-group o no està configurat en course/module.json');
  }

  if (args.input && args.file) {
    throw new Error('Usa nomes --input o --file, no els dos alhora');
  }

  const text = args.file ? await readFile(args.file, 'utf8') : (args.input || '');
  const rows = parseRepositories(text, defaultGroup);

  for (const row of rows) {
    console.log(`${row.repo} ${row.group}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`No s'ha pogut preparar la llista de repositoris: ${error.message}`);
    process.exit(1);
  });
}
