import client from './client';

export const listTables = () => client.get('/tables/');
export const activateTable = (tableId: number) =>
  client.post(`/tables/${tableId}/activate/`);
export const joinTable = (joinCode: string) =>
  client.post('/tables/join/', {join_code: joinCode});
