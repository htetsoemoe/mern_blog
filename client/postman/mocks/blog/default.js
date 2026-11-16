// Local QA fixture derived from server/controllers. Excluded from the application build.
const http = require('http');
const KEY = 'blog-qa.state';
const userId = '507f1f77bcf86cd799439011';
const seed = () => ({
  user: {
    _id: userId,
    name: 'Ada Reader',
    email: 'reader@example.test',
    avatar: '',
    posts: 2,
  },
  flags: {},
  posts: [
    {
      _id: '507f191e810c19729de860ea',
      title: 'The art of paying attention',
      category: 'Art',
      description:
        '<p>A small observation can change the way we see an ordinary day.</p><script>window.badScript=true</script><img src=x onerror="window.badScript=true"><p>There is a story in the things we tend to overlook.</p>',
      creator: userId,
      thumbnail: 'cover.jpg',
      createdAt: '2026-11-15T08:00:00Z',
      updatedAt: '2026-11-15T08:00:00Z',
    },
    {
      _id: '507f191e810c19729de860eb',
      title: 'Learning to begin again',
      category: 'Education',
      description:
        'Starting something new is often an exercise in patience. A few thoughts on making room for the unfamiliar.',
      creator: userId,
      thumbnail: 'cover.jpg',
      createdAt: '2026-11-14T08:00:00Z',
      updatedAt: '2026-11-14T08:00:00Z',
    },
  ],
});
function readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        const fields = {};
        for (const match of raw.matchAll(
          /name="(title|category|description)"\r\n\r\n([\s\S]*?)\r\n--/g,
        ))
          fields[match[1]] = match[2];
        resolve(fields);
      }
    });
  });
}
http
  .createServer(async (req, res) => {
    const pendingBody = readBody(req);
    const path = new URL(req.url, 'http://localhost').pathname;
    const { method } = req;
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS',
    );
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    if (method === 'OPTIONS') return send(204, null);
    let state = (await pm.state.get(KEY)) || seed();
    const rawBody = await pendingBody;
    let body = rawBody;
    if (typeof rawBody === 'string') {
      body = {};
      for (const match of rawBody.matchAll(
        /name="(title|category|description)"\r\n\r\n([\s\S]*?)\r\n--/g,
      ))
        body[match[1]] = match[2];
    }
    if (path === '/__test/reset') {
      state = seed();
      await pm.state.set(KEY, state);
      return send(200, { reset: true });
    }
    if (path === '/__test/fail') {
      state.flags = { ...state.flags, ...body };
      await pm.state.set(KEY, state);
      return send(200, state.flags);
    }
    if (path.startsWith('/uploads/')) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640"><rect width="960" height="640" fill="#cedbdf"/><circle cx="660" cy="160" r="70" fill="#f6f4e6"/><path d="M0 450L290 180L610 520L800 300L960 450V640H0Z" fill="#72908d"/><path d="M0 530L240 390L500 590L760 430L960 520V640H0Z" fill="#3c625c"/></svg>',
      );
    }
    if (path === '/api/users/register' && method === 'POST') {
      if (
        !body.name ||
        !body.email ||
        body.password?.trim().length < 6 ||
        body.password !== body.password2
      )
        return send(422, { message: 'Invalid registration fields.' });
      return send(201, `New user ${body.email} registered.`);
    }
    if (path === '/api/users/login' && method === 'POST') {
      if (
        body.email !== 'reader@example.test' ||
        !['reader123', 'reader456'].includes(body.password)
      )
        return send(422, { message: 'Invalid credentials.' });
      state.flags.expired = false;
      await pm.state.set(KEY, state);
      return send(200, {
        token: 'test-session',
        id: userId,
        name: state.user.name,
      });
    }
    if (method === 'GET' && state.flags.reads)
      return send(500, {
        message: 'Temporarily unavailable. Please try again.',
      });
    if (method === 'GET' && path === '/api/users')
      return send(200, [state.user]);
    if (method === 'GET' && path === `/api/users/${userId}`)
      return send(200, state.user);
    if (method === 'GET' && path === '/api/posts')
      return send(200, state.posts);
    if (method === 'GET' && path.startsWith('/api/posts/categories/'))
      return send(
        200,
        state.posts.filter(
          (post) => post.category === decodeURIComponent(path.split('/').pop()),
        ),
      );
    if (method === 'GET' && path.startsWith('/api/posts/users/'))
      return send(
        200,
        state.posts.filter((post) => post.creator === path.split('/').pop()),
      );
    if (method === 'GET' && path.startsWith('/api/posts/'))
      return send(
        state.posts.some((post) => post._id === path.split('/').pop())
          ? 200
          : 404,
        state.posts.find((post) => post._id === path.split('/').pop()) || {
          message: 'Post not found.',
        },
      );
    if (
      ['POST', 'PATCH', 'DELETE'].includes(method) &&
      path.startsWith('/api/')
    ) {
      if (!req.headers.authorization)
        return send(402, { message: 'Unauthorized. No token.' });
      if (state.flags.expired)
        return send(403, { message: 'Unauthorized. Invalid token.' });
      if (state.flags.writes)
        return send(500, { message: 'Unable to save. Please try again.' });
    }
    if (method === 'PATCH' && path === '/api/users/edit-user') {
      if (
        !body.name ||
        !body.email ||
        !body.currentPassword ||
        !body.newPassword ||
        body.newPassword !== body.confirmNewPassword
      )
        return send(422, { message: 'Fill in all fields.' });
      state.user = { ...state.user, name: body.name, email: body.email };
      await pm.state.set(KEY, state);
      return send(200, {
        ...state.user,
        password: 'fixture-hash-must-not-be-stored',
      });
    }
    if (method === 'POST' && path === '/api/users/change-avatar') {
      state.user.avatar = 'avatar.png';
      await pm.state.set(KEY, state);
      return send(200, {
        ...state.user,
        password: 'fixture-hash-must-not-be-stored',
      });
    }
    if (method === 'POST' && path === '/api/posts') {
      const post = {
        _id: `test-${Date.now()}`,
        ...body,
        creator: userId,
        thumbnail: 'cover.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!post.title || !post.category || !post.description)
        return send(422, {
          message: 'Fill in all fields and choose thumbnail.',
        });
      state.posts.unshift(post);
      state.user.posts++;
      await pm.state.set(KEY, state);
      return send(201, post);
    }
    if (
      ['PATCH', 'DELETE'].includes(method) &&
      path.startsWith('/api/posts/')
    ) {
      const index = state.posts.findIndex(
        (post) => post._id === path.split('/').pop(),
      );
      if (index < 0) return send(404, { message: 'Post not found.' });
      if (method === 'DELETE') {
        state.posts.splice(index, 1);
        state.user.posts--;
        await pm.state.set(KEY, state);
        return send(200, 'Post deleted successfully.');
      }
      state.posts[index] = {
        ...state.posts[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await pm.state.set(KEY, state);
      return send(200, state.posts[index]);
    }
    return send(501, {
      message: `Not modeled by the QA fixture: ${method} ${path}`,
    });
  })
  .listen(process.env.PORT || 4500);
