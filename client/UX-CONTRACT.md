# Commonplace interaction contract

Visual decisions: [DESIGN.md](DESIGN.md). Domain evidence is the existing `../server/routes`, `../server/controllers` and `../server/models` code. No server behavior is changed by this client.

## Canonical ownership

| Capability     | Canonical owner                                       | Source of truth             | Allowed variants                                                         | Verification                        |
| -------------- | ----------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| Form           | `src/components/ui.jsx` Field; `src/hooks/useForm.js` | This contract               | Create/edit/auth; app validation with field errors and first-error focus | Unit and browser validation         |
| Select/Listbox | Native select in `src/pages/Editor.jsx`               | Server category enum        | Native; OS popup geometry and keyboard behavior accepted                 | Browser keyboard/category selection |
| Scrollbar      | `src/styles.css`                                      | DESIGN.md                   | Global standards and WebKit fallback; forced-colors uses OS              | Computed styles and mobile overflow |
| Toast          | `src/stores/session.js` useNotice; Layout             | This contract               | One dismissible, fixed success notice; polite live region                | Browser save feedback               |
| CRUD           | `src/lib/api.js`; Editor and MyPosts                  | Server controllers          | Create/edit return to My posts; delete refreshes owning list             | Browser flow and request payloads   |
| Dialog         | `src/components/ui.jsx` Modal                         | This contract               | Native modal shell with app content                                      | Keyboard focus, Escape, restoration |
| Upload         | `src/components/ui.jsx` ImageUpload / UploadProgress  | Server upload fields/limits | Single raster image, picker/drop/preview/remove/progress/cancel          | Boundary units and browser upload   |

## Business sources

- Authentication: `userControllers.loginUser` returns `{ token, id, name }`, expiring after one day. `authMiddleware` enforces bearer auth and returns 402 for missing tokens, 403 for invalid tokens. Ownership 403 errors leave the session intact.
- Registration: `userControllers.registerUser` requires `password2` confirmation and returns a message, not a token. Successful signup goes to login.
- Permissions and deletion: `postControllers.editPost/deletePost` restrict changes to the creator. Deletion permanently removes the post and thumbnail; confirm with title and consequence. No undo is advertised.
- Profile: `userControllers.editUser` requires name, email, currentPassword, newPassword and confirmNewPassword. Profile form explicitly reflects this coupled operation. Extract only safe profile fields from mutation responses.
- Uploads: `userControllers.changeAvatar` accepts `avatar` up to 500000 bytes; `postControllers` accepts `thumbnail` up to 2000000 bytes. Display files from `/uploads/:filename`. The editor sends JSON for updates without a replacement image and FormData when uploading.
- Content: `models/postModel` defines eight categories and timestamps. The client requires at least 12 non-whitespace body characters to satisfy both create and edit. Render plain text as text and sanitize existing HTML before insertion.

## State and recovery

Public read requests support loading, empty, error and retry states and cancel on route changes. Failure to load authors does not block story reading; bylines fall back to a working author-profile link. Category state is expressed in the route. The API returns complete arrays, so the initial client renders those arrays; it does not claim pagination or issue unsupported query parameters.

Mutations wait for confirmed server success. They have no automatic retry because an interrupted or timed-out request may already have committed. Cancel aborts the browser request and explains uncertain completion; it cannot roll back server work. Keep entered fields and selected files on failures for explicit retry. Recheck the owning list/profile before resubmitting an uncertain mutation.

JWTs stay in Zustand memory, never in browser persistent storage. Reloading signs the user out. Expired-token failures retain the current form, mark the session expired, disable saving and show a sign-in action. This opens the shared login form in a modal and restores the session without navigating or losing the editor. Navigating away from dirty editor/profile forms requires explicit discard, including sign-out navigation. Browser unload uses the platform's narrowly scoped beforeunload warning. There is no refresh API, autosave or persistent draft feature.

Account settings and editor guard navigation whenever dirty or saving. The delete modal cannot close while deletion is pending. Error messages stay inline until the next submission. All password fields support reveal/hide, autofill and paste. Date display uses the reader's local timezone and English month/day/year formatting. Public user email addresses are not displayed.

## Verification

Run `npm run lint`, `npm test`, and `npm run build`. Unit tests cover byte boundaries, upload type rejection, password-hash stripping, return-path safety and API payload contracts. Browser checks should cover public read success/failure/empty, login/register validation, route protection, native category selection, upload preview/validation, dirty-navigation dialogs, mutation success and failure, keyboard and mobile overflow. Live end-to-end mutation tests require an explicitly supplied disposable account/database; local browser fixture checks do not establish live database integration.
