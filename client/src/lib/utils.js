export const CATEGORIES = [
  'Agriculture',
  'Business',
  'Education',
  'Entertainment',
  'Art',
  'Investment',
  'Uncategorized',
  'Weather',
];
export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
export const THUMBNAIL_LIMIT = 2000000;
export const AVATAR_LIMIT = 500000;

export function validateImage(file, limit) {
  if (!file) return 'Choose an image.';
  if (!IMAGE_TYPES.includes(file.type))
    return 'Choose a JPG, PNG, WebP, or GIF image.';
  if (!file.size) return 'This image is empty. Choose another file.';
  if (file.size > limit)
    return `Choose an image no larger than ${limit === AVATAR_LIMIT ? '500 KB' : '2 MB'}.`;
  return '';
}

export function safeUser(user) {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    posts: user.posts || 0,
  };
}

export function errorMessage(error) {
  if (error.code === 'ERR_CANCELED')
    return 'Request cancelled. The server may still finish saving. Check your posts or profile before trying again.';
  if (error.response?.data?.message) return String(error.response.data.message);
  if (error.code === 'ECONNABORTED')
    return 'The request timed out. Check whether your change was saved before trying again.';
  return 'Unable to reach the server. Check your connection and try again.';
}

export function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
}

export function plainText(value = '') {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function safeReturn(value) {
  return value?.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.startsWith('/login') &&
    !value.startsWith('/register')
    ? value
    : '/my-posts';
}
