import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Platform} from 'react-native';

const BASE_URL = Platform.OS === 'ios'
  ? 'http://localhost:8000/api'
  : 'http://10.0.2.2:8000/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
