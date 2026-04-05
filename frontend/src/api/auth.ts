import client from './client';

export const register = (data: {email: string; password: string; name: string; phone?: string}) =>
  client.post('/auth/register/', data);

export const login = (email: string, password: string) =>
  client.post('/auth/login/', {email, password});

export const getProfile = () => client.get('/auth/profile/');

export const updateProfile = (data: {name?: string; phone?: string}) =>
  client.patch('/auth/profile/', data);
