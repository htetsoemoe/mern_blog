import axios from 'axios';
import { useSession } from '../stores/session';

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');
const uploadBase = API_URL.replace(/\/api$/, '');
export const imageUrl = (filename) =>
  filename ? `${uploadBase}/uploads/${encodeURIComponent(filename)}` : '';

export const api = axios.create({ baseURL: API_URL, timeout: 30000 });
api.interceptors.request.use((config) => {
  const { token } = useSession.getState();
  if (token && config.authenticated)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message;
    // A 403 ownership denial must not sign the author out.
    if (
      error.config?.authenticated &&
      (error.response?.status === 402 ||
        (error.response?.status === 403 &&
          message === 'Unauthorized. Invalid token.'))
    ) {
      useSession.getState().expire();
    }
    return Promise.reject(error);
  },
);
