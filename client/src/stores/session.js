import { create } from 'zustand';
import { safeUser } from '../lib/utils';

// Tokens stay in memory. A full page reload requires signing in again.
export const useSession = create((set) => ({
  user: null,
  token: null,
  expired: false,
  login: ({ token, ...user }) =>
    set({ token, user: safeUser(user), expired: false }),
  updateUser: (user) => set({ user: safeUser(user) }),
  expire: () => set({ expired: true }),
  logout: () => set({ user: null, token: null, expired: false }),
}));

let notificationId = 0;
export const useNotice = create((set) => ({
  notice: null,
  show: (message) => set({ notice: { id: ++notificationId, message } }),
  dismiss: () => set({ notice: null }),
}));
