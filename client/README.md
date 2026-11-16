# Commonplace client

Standalone React + Vite blog frontend using Tailwind CSS, Zustand, Axios and React Router. Connects to the existing server without modifying it.

## Run locally

Requires Node.js 22.12+ (or the version required by the installed Vite release).

```powershell
cd server
npm install
npm run dev
```

In another terminal:

```powershell
cd client
npm install
npm run dev
```

Open **http://localhost:3000**. The fixed port matches the server's CORS origin. The API defaults to `http://localhost:5000/api`. If the server uses a different port, copy `.env.example` to `.env`, change `VITE_API_URL`, and restart Vite. This URL must end in `/api`; images use the same host's `/uploads` path. All `VITE_` variables are public. Never copy server JWT or database secrets into this project.

The server needs its existing MongoDB connection and JWT configuration before API requests can succeed. There are no bundled fake stories or automatic account creation.

## Included

- Latest stories, category pages, article reading, author directory and author pages.
- Registration, login, sign-out and protected account/writing routes.
- My posts, creation, editing and confirmed permanent deletion, with creator-only editing controls.
- Thumbnail and avatar upload with preview, byte/type validation, progress, cancellation and retry after reviewing errors.
- Profile details/password update using the current API's combined form.
- Responsive layouts, keyboard focus, inline errors, notifications, loading/empty states and unsaved-change guards.

## API compatibility

| Operation                 | Request                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Register                  | `POST /users/register` — name, email, password, password2                                     |
| Login                     | `POST /users/login` — email, password                                                         |
| Authors / profile         | `GET /users`, `GET /users/:id`                                                                |
| Avatar                    | `POST /users/change-avatar` — multipart avatar, max 500000 bytes                              |
| Account update            | `PATCH /users/edit-user` — name, email, currentPassword, newPassword, confirmNewPassword      |
| Stories / detail          | `GET /posts`, `GET /posts/:id`                                                                |
| Category / author stories | `GET /posts/categories/:category`, `GET /posts/users/:id`                                     |
| Publish                   | `POST /posts` — multipart title, category, description, thumbnail                             |
| Edit                      | `PATCH /posts/:id` — JSON title/category/description, or multipart with replacement thumbnail |
| Delete                    | `DELETE /posts/:id`                                                                           |

Mutations include `Authorization: Bearer <token>`. Thumbnail limit: 2000000 bytes. Supported picker formats: JPEG, PNG, WebP and GIF. Existing sanitized HTML bodies remain readable; the editor edits the stored description directly and supports plain text. This is not a rich-text editor or an inline attachment uploader.

Tokens live only in memory: a reload requires sign-in. No refresh endpoint or persistent login is invented. No search, pagination, drafts, comments, likes, bookmarks, password recovery, admin roles or general attachment features are implemented.

## Checks and production build

```powershell
npm run lint
npm run format:check
npm test
npm run build
npm run preview
```

Vite writes static files to `dist/`. Configure a production host to return `index.html` for client routes. Set `VITE_API_URL` before building and separately configure the server to allow the deployment's origin. Never deploy with a localhost API URL.

## Existing server limitations

The frontend filters profile responses before storing them, but the server still returns password hashes from avatar/profile mutations. The server deletes old images before successfully saving replacements, and lacks upload content validation. Client checks improve normal usage but cannot fix these server behaviors. Abort/timeouts do not guarantee rollback; check whether a write succeeded before retrying. These server fixes are outside this client's scope.

Design and behavior ownership are documented in `DESIGN.md` and `UX-CONTRACT.md`.

## Browser verification with local fixtures

The QA-only fixture under `postman/` models the inspected controller contracts. It is excluded from the application bundle and never connects to MongoDB. Its test-only reset/failure controls are not application features or proposed server endpoints. The service is owned by this repository, so no third-party mock lookup is needed; CLI 1.74.0 did not support `postman status`.

With Postman CLI 1.74+ available, start the simulation in one terminal:

```powershell
cd client
npm run qa:api
```

Then, with port 3000 free, run in another terminal:

```powershell
npm run test:e2e
```

The browser runner starts its own Vite process with a fixture API URL. Close any normal Vite preview first. Tests use installed Microsoft Edge (`channel: msedge`); if unavailable, select an installed Playwright browser in `playwright.config.js`. Local test credentials are only fixture values, not real accounts. This suite checks browser behavior and HTTP serialization against the local model, not live database persistence. See `VERIFICATION.md` for results and limits.
