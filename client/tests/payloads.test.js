import test from 'node:test';
import assert from 'node:assert/strict';
import { postBody } from '../src/lib/payloads.js';

const values = {
  title: '  A new story  ',
  category: 'Art',
  description: 'A meaningful story body.',
};
test('editing without an image sends JSON fields and preserves the body', () => {
  assert.deepEqual(postBody(values), {
    title: 'A new story',
    category: 'Art',
    description: values.description,
  });
});

test('image writes send only the exact server multipart keys', () => {
  const file = new File(['image'], 'cover.png', { type: 'image/png' });
  const payload = postBody(values, file);
  assert.ok(payload instanceof FormData);
  assert.deepEqual(
    [...payload.keys()],
    ['title', 'category', 'description', 'thumbnail'],
  );
  assert.equal(payload.get('title'), 'A new story');
  assert.equal(payload.get('description'), values.description);
  assert.equal(payload.get('thumbnail').name, 'cover.png');
});
