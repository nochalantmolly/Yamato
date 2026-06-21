import client from './client';

export const listTables = () => client.get('/tables/');
export const getTableCodes = () => client.get('/tables/codes/');
export const joinTable = (code: string) =>
  client.post('/tables/join/', {code});
export const closeTable = (tableId: number) =>
  client.post(`/tables/${tableId}/close/`);
export const regenerateCode = (tableId: number) =>
  client.post(`/tables/${tableId}/regenerate-code/`);
export const toggleTableStatus = (tableId: number) =>
  client.post(`/tables/${tableId}/toggle-status/`);
