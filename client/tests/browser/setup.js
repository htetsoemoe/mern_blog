import { createServer } from 'vite';

export default async function setup() {
  // Own the server in this process so Windows teardown doesn't depend on
  // terminating an npm -> shell -> Vite process tree. Fail if port 3000 is busy.
  const server = await createServer({
    server: { host: 'localhost', port: 3000, strictPort: true },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        'http://localhost:4500/api/api',
      ),
    },
  });
  await server.listen();
  return async () => {
    await server.close();
  };
}
