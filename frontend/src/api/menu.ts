import client from './client';

export const listCategories = () => client.get('/menu/categories/');
export const listItems = (params?: {category?: number; search?: string}) =>
  client.get('/menu/items/', {params});
export const getItem = (id: number) => client.get(`/menu/items/${id}/`);
export const createItem = (data: object) => client.post('/menu/items/', data);
export const updateItem = (id: number, data: object) => client.patch(`/menu/items/${id}/`, data);
export const deleteItem = (id: number) => client.delete(`/menu/items/${id}/`);
export const toggleItem = (id: number) => client.patch(`/menu/items/${id}/toggle/`);
export const createCategory = (data: {name: string; sort_order?: number}) =>
  client.post('/menu/categories/', data);
export const updateCategory = (id: number, data: {name?: string; sort_order?: number}) =>
  client.patch(`/menu/categories/${id}/`, data);
export const deleteCategory = (id: number) => client.delete(`/menu/categories/${id}/`);
