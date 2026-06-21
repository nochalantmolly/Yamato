import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from 'src/config';

const BASE_URL = API_BASE_URL;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

// Session token for anonymous customers (set after joining table)
let _sessionToken: string | null = null;
export function setSessionToken(token: string | null) {
  _sessionToken = token;
}

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (_sessionToken) {
    config.headers['X-Session-Token'] = _sessionToken;
  }
  return config;
});

client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {refresh});
          const newAccess = res.data.access;
          await AsyncStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default client;
