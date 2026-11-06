import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBranchName, createArgs, parseWorktrees } from '../tools/dev/worktrunk-isolation.mjs';

test('Worktrunk opt-in accepts only isolated task branches', () => {
  assert.equal(validateBranchName('fix/arena-pagination'), 'fix/arena-pagination');
  assert.deepEqual(createArgs('test/johto-visual'), ['switch', '--create', 'test/johto-visual']);
});

test('reject dangerous names, default branch and ref syntax', () => {
  for (const name of ['main', 'master', '../main', 'fix/../main', 'fix/FORCE',
                      'fix/hi@{0}', 'fix/', 'feature/unsafe', 'feat/a..b', 'fix/x.']) {
    assert.throws(() => validateBranchName(name), /Branch must/);
  }
});

test('parse native Git porcelain without invoking worktrunk', () => {
  const out = 'worktree /tmp/pokemon-main\nHEAD abcdef\nbranch refs/heads/main\n\nworktree /tmp/pokemon-fix\nHEAD 123456\nbranch refs/heads/fix/arena-pagination\n';
  assert.deepEqual(parseWorktrees(out), [
    {path: '/tmp/pokemon-main', head: 'abcdef', branch: 'main'},
    {path: '/tmp/pokemon-fix', head: '123456', branch: 'fix/arena-pagination'}
  ]);
});
