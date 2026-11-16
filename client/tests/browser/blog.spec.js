import { test, expect } from '@playwright/test';

const simulation = 'http://localhost:4500/api';
async function login(page) {
  await page.goto('/login');
  await page
    .getByLabel('Email address', { exact: true })
    .fill('reader@example.test');
  await page.getByLabel('Password', { exact: true }).fill('reader123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Sign out', exact: true }),
  ).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.post(`${simulation}/__test/reset`);
});

test('public feed, categories, authors and sanitized reading', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Good stories. New ways of seeing.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The art of paying attention' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/desktop-home.png',
    fullPage: true,
  });
  await page
    .getByRole('heading', { name: 'The art of paying attention' })
    .getByRole('link')
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'The art of paying attention',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.article-body')).toContainText(
    'A small observation',
  );
  await expect(
    page.locator('.article-body script, .article-body img'),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Authors', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ada Reader', exact: true }),
  ).toBeVisible();
  await page.locator('.author-tile').first().click();
  await expect(
    page.getByRole('heading', { name: 'Stories by Ada Reader' }),
  ).toBeVisible();
  await page.goto('/categories/Weather');
  await expect(
    page.getByRole('heading', { name: 'The next story could be yours' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile layout, keyboard navigation, errors and retry', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await request.post(`${simulation}/__test/fail`, { data: { reads: true } });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'Temporarily unavailable',
  );
  await request.post(`${simulation}/__test/fail`, { data: { reads: false } });
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('heading', { name: 'The art of paying attention' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: 'test-results/mobile-home.png',
    fullPage: true,
  });
  await page.goto('/register');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByLabel('Your name')).toBeFocused();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('reader123');
  await page
    .getByRole('button', { name: 'Show password', exact: true })
    .click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
});

test('registration sends password2 and returns to sign in', async ({
  page,
}) => {
  await page.goto('/register');
  await page.getByLabel('Your name').fill('New Writer');
  await page.getByLabel('Email address').fill('new@example.test');
  await page.getByLabel('Password', { exact: true }).fill('newpass123');
  await page.getByLabel('Confirm password', { exact: true }).fill('newpass123');
  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith('/users/register') && request.method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  expect((await submitted).postDataJSON().password2).toBe('newpass123');
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByText('Account created. Sign in to start writing.'),
  ).toBeVisible();
});

test('protected route, full story CRUD, upload and dirty navigation', async ({
  page,
  request,
}) => {
  await page.goto('/write');
  await expect(page).toHaveURL(/login/);
  await login(page);
  await page
    .getByRole('link', { name: 'Write a story', exact: true })
    .first()
    .click();
  await page.getByLabel('Story title').fill('A browser-tested story');
  await page
    .getByLabel('Your story')
    .fill('A longer story written for the local browser simulation.');
  await page.getByLabel('Category').selectOption('Education');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('link', { name: 'Authors', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Leave without saving?');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Story title')).toHaveValue(
    'A browser-tested story',
  );
  await page.getByLabel('Cover image').setInputFiles({
    name: 'bad.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await expect(
    page.getByText('Choose a JPG, PNG, WebP, or GIF image.'),
  ).toBeVisible();
  await page.getByLabel('Cover image').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByAltText('Selected image preview')).toBeVisible();
  await page.screenshot({
    path: 'test-results/desktop-editor.png',
    fullPage: true,
  });
  await request.post(`${simulation}/__test/fail`, { data: { writes: true } });
  await page.getByRole('button', { name: 'Publish story' }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to save');
  await expect(page.getByLabel('Story title')).toHaveValue(
    'A browser-tested story',
  );
  await request.post(`${simulation}/__test/fail`, { data: { writes: false } });
  const createRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith('/posts') && request.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Publish story' }).click();
  const sent = await createRequest;
  expect(sent.headers().authorization).toBe('Bearer test-session');
  expect(sent.headers()['content-type']).toContain(
    'multipart/form-data; boundary=',
  );
  await expect(page).toHaveURL(/my-posts/);
  const row = page
    .locator('.manage-row')
    .filter({ hasText: 'A browser-tested story' });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'Edit A browser-tested story' }).click();
  await page.getByLabel('Story title').fill('An edited browser story');
  const updateRequest = page.waitForRequest(
    (request) =>
      request.url().includes('/posts/') && request.method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect((await updateRequest).headers()['content-type']).toContain(
    'application/json',
  );
  await expect(page).toHaveURL(/my-posts/);
  await page
    .getByRole('button', {
      name: 'Delete An edited browser story',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Delete story', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'An edited browser story', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('Story deleted.', { exact: true })).toBeVisible();
});

test('profile update and avatar follow the existing server fields', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: 'Account', exact: true }).click();
  await page.getByLabel('Your name').fill('Ada Updated');
  await page.getByLabel('Current password', { exact: true }).fill('reader123');
  await page.getByLabel('New password', { exact: true }).fill('reader456');
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill('reader456');
  const update = page.waitForRequest(
    (request) =>
      request.url().endsWith('/users/edit-user') &&
      request.method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Save account changes' }).click();
  expect((await update).postDataJSON()).toMatchObject({
    name: 'Ada Updated',
    currentPassword: 'reader123',
    newPassword: 'reader456',
    confirmNewPassword: 'reader456',
  });
  await expect(
    page.getByText('Account details updated.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Current password', { exact: true }),
  ).toHaveValue('');
  await page.getByLabel('Profile photo').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from('avatar'),
  });
  const avatar = page.waitForRequest(
    (request) =>
      request.url().endsWith('/users/change-avatar') &&
      request.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Update photo' }).click();
  expect((await avatar).headers()['content-type']).toContain(
    'multipart/form-data; boundary=',
  );
  await expect(
    page.getByText('Profile photo updated.', { exact: true }),
  ).toBeVisible();
});

test('expired session preserves editor through modal reauthentication', async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto('/');
  // Full reload intentionally loses the memory session, so sign in again via SPA links.
  await login(page);
  await page
    .getByRole('link', { name: 'Write a story', exact: true })
    .first()
    .click();
  await page.getByLabel('Story title').fill('Keep my words');
  await page
    .getByLabel('Your story')
    .fill('These words should survive a session expiration.');
  await page.getByLabel('Cover image').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('image'),
  });
  await request.post(`${simulation}/__test/fail`, { data: { expired: true } });
  await page.getByRole('button', { name: 'Publish story' }).click();
  await expect(
    page.getByText('Your session has expired.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Sign in again', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email address').fill('reader@example.test');
  await dialog.getByLabel('Password', { exact: true }).fill('reader123');
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Story title')).toHaveValue('Keep my words');
  await expect(
    page.getByRole('button', { name: 'Publish story' }),
  ).toBeEnabled();
});
