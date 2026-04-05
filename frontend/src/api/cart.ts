import client from './client';

export const getCart = (sessionId: number) =>
  client.get('/cart/', {params: {session: sessionId}});
export const addCartItem = (data: {session: number; menu_item: number; quantity: number}) =>
  client.post('/cart/items/', data);
export const updateCartItem = (id: number, quantity: number) =>
  client.patch(`/cart/items/${id}/`, {quantity});
export const deleteCartItem = (id: number) =>
  client.delete(`/cart/items/${id}/`);
