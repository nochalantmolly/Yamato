import client from './client';

export const submitOrder = (sessionId: number) =>
  client.post('/orders/', {session: sessionId});
export const listOrders = (params?: {session?: number}) =>
  client.get('/orders/', {params});
export const getOrder = (id: number) => client.get(`/orders/${id}/`);
export const updateOrderStatus = (id: number, status: string) =>
  client.patch(`/orders/${id}/status/`, {status});
export const checkout = (orderId: number) =>
  client.post(`/orders/${orderId}/checkout/`);
