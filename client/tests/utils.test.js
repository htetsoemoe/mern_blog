import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_LIMIT,
  THUMBNAIL_LIMIT,
  CATEGORIES,
  validateImage,
  safeUser,
  safeReturn,
  errorMessage,
  plainText,
} from '../src/lib/utils.js';

test('image validation matches the server decimal byte boundaries', () => {
  for (const limit of [AVATAR_LIMIT, THUMBNAIL_LIMIT]) {
    assert.equal(validateImage({ type: 'image/jpeg', size: limit }, limit), '');
    assert.match(
      validateImage({ type: 'image/jpeg', size: limit + 1 }, limit),
      /no larger/,
    );
  }
});

test('image picker rejects missing, empty and executable/vector files', () => {
  assert.match(validateImage(null, AVATAR_LIMIT), /Choose/);
  assert.match(
    validateImage({ type: 'image/png', size: 0 }, AVATAR_LIMIT),
    /empty/,
  );
  assert.match(
    validateImage({ type: 'image/svg+xml', size: 100 }, AVATAR_LIMIT),
    /JPG/,
  );
  assert.match(
    validateImage({ type: 'text/html', size: 100 }, AVATAR_LIMIT),
    /JPG/,
  );
});

test('mutation user responses are explicitly allowlisted', () => {
  const user = safeUser({
    _id: '123',
    name: 'Reader',
    email: 'r@example.com',
    password: '$2b$secret',
    token: 'secret',
    __v: 2,
  });
  assert.deepEqual(user, {
    id: '123',
    name: 'Reader',
    email: 'r@example.com',
    avatar: '',
    posts: 0,
  });
  assert.equal('password' in user, false);
  assert.equal('token' in user, false);
});

test('return destinations cannot leave the site or loop through authentication', () => {
  for (const path of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login',
    '/register',
    undefined,
  ])
    assert.equal(safeReturn(path), '/my-posts');
  assert.equal(safeReturn('/posts/123/edit'), '/posts/123/edit');
});

test('cancel and timeout errors explain uncertain mutation completion', () => {
  assert.match(errorMessage({ code: 'ERR_CANCELED' }), /may still finish/);
  assert.match(errorMessage({ code: 'ECONNABORTED' }), /whether.*saved/);
  assert.equal(
    errorMessage({
      response: { data: { message: 'Invalid current password.' } },
    }),
    'Invalid current password.',
  );
});

test('categories match the server and HTML excerpts are text-only', () => {
  assert.equal(CATEGORIES.length, 8);
  assert.ok(CATEGORIES.includes('Uncategorized'));
  assert.equal(
    plainText('<h2>A story</h2><p>from today</p>'),
    'A story from today',
  );
  assert.equal(
    plainText('<p>Read &amp; write</p><script>alert(1)</script>'),
    'Read & write',
  );
});
