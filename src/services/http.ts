import axios from 'axios';
import { API_BASE } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

export const http = axios.create({ baseURL: API_BASE });

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
