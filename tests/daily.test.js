import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, seedForDay, readBest, saveBest } from '../src/daily.js';
import { createRun } from '../src/model.js';
test('daily layout uses Berlin date and repeats exactly', () => {
  assert.equal(dayKey(new Date('2026-11-07T23:30:00Z')), '2026-11-08');
  assert.deepEqual(createRun('2026-11-07'), createRun('2026-11-07'));
  assert.notDeepEqual(createRun('2026-11-07').fish, createRun('2026-11-08').fish);
  for (const date of ['2026-02-30', 'bad', '2026-13-01']) assert.throws(() => seedForDay(date), /valid/);
});
test('personal best preserves unrelated data, larger records and other dates', () => {
  const map = new Map([['original-save', 'keep']]); const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  assert.equal(readBest('2026-11-07', storage), 0); assert.equal(saveBest('2026-11-07', 250, storage), 250);
  assert.equal(saveBest('2026-11-07', 20, storage), 250); assert.equal(readBest('2026-11-08', storage), 0);
  assert.equal(map.get('original-save'), 'keep'); assert.ok([...map.keys()].filter(k => k !== 'original-save').every(k => k.startsWith('schnabel-playground-six:goodies-v1:best:')));
  assert.throws(() => saveBest('2026-11-07', -1, storage), /non-negative/);
});
test('blocked or corrupt storage never prevents playing', () => {
  const blocked = { getItem() { throw Error('blocked'); } }; assert.equal(readBest('2026-11-07', blocked), null); assert.throws(() => saveBest('2026-11-07', 10, blocked), /gespeichert/);
  assert.equal(readBest('2026-11-07', { getItem: () => 'not a score' }), 0);
});
