#!/usr/bin/env node
/**
 * Worktrunk opt-in for isolated development: lists worktrees or safely creates
 * one branch through the upstream `wt` CLI. Never merges, deletes, deploys
 * or edits game/save files. No download or automatic installation.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function validateBranchName(name) {
  if (typeof name !== 'string' || !/^(?:feat|fix|test|research)\/[a-z0-9][a-z0-9._-]{1,62}$/.test(name) ||
      name.endsWith('.') || name.includes('..') || name.includes('@{')) {
    throw new Error('Branch must be feat|fix|test|research/<lowercase-name>, no traversal, dots or special Git refs');
  }
  return name;
}

export function createArgs(name) {
  return ['switch', '--create', validateBranchName(name)];
}

export function parseWorktrees(text) {
  return text.trim().split(/\n\s*\n/).filter(Boolean).map(block => {
    const entry = {};
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('worktree ')) entry.path = line.slice(9);
      else if (line.startsWith('branch refs/heads/')) entry.branch = line.slice(18);
      else if (line.startsWith('HEAD ')) entry.head = line.slice(5);
      else if (line === 'detached') entry.detached = true;
      else if (line === 'locked') entry.locked = true;
    }
    return entry;
  });
}

function run(program, args, opts = {}) {
  const p = spawnSync(program, args, {encoding: 'utf8', shell: false, ...opts});
  if (p.error) throw new Error(`${program} unavailable: ${p.error.message}`);
  if (p.status !== 0) throw new Error(`${program} failed (${p.status}): ${(p.stderr || '').trim()}`);
  return p.stdout || '';
}

export function main(args) {
  const command = args[0] || 'status';
  if (command === 'status' && args.length <= 1) {
    const entries = parseWorktrees(run('git', ['worktree', 'list', '--porcelain']));
    console.log(JSON.stringify({worktrees: entries, count: entries.length}, null, 2));
    return;
  }
  if (command === 'create' && args.length === 2) {
    const branch = validateBranchName(args[1]);
    // Refuse even untracked local edits: do not start experiments on dirty state.
    if (run('git', ['status', '--porcelain', '--untracked-files=all']).trim()) {
      throw new Error('Current worktree has uncommitted or untracked changes; commit/stash before creating branch');
    }
    const worktrees = parseWorktrees(run('git', ['worktree', 'list', '--porcelain']));
    if (!worktrees.length) throw new Error('Git worktree information unavailable');
    run('wt', createArgs(branch), {stdio: 'inherit'});
    console.log('Worktrunk created isolated worktree for ' + branch);
    return;
  }
  throw new Error('Usage: node tools/dev/worktrunk-isolation.mjs status | create feat|fix|test|research/name');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (err) { console.error(err.message); process.exitCode = 1; }
}
