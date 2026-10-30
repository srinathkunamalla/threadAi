import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDemo, inputSchema } from './generator';

test('validates structured generation input', () => {
  assert.equal(inputSchema.safeParse({ postText: 'too short', perspective: 'technical', length: 'short', context: '' }).success, false);
  assert.equal(inputSchema.safeParse({ postText: 'A real post about reliable agent workflows and production outcomes.', perspective: 'technical', length: 'balanced', context: '' }).success, true);
});

test('demo produces three honest, distinct variants', () => {
  const result = generateDemo({ postText: 'Agent reliability depends on retries and validation in production.', perspective: 'technical', length: 'balanced', context: '' });
  assert.equal(result.mode, 'demo');
  assert.equal(result.drafts.length, 3);
  assert.equal(new Set(result.drafts.map(d => d.text)).size, 3);
  assert.equal(result.drafts[0].kind, 'Technical insight');
});
