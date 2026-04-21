#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = path.join(__dirname, 'orchestrator-manager.ts');
const forwardArgs = process.argv.slice(2);

execFileSync('npx', ['tsx', target, ...forwardArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
