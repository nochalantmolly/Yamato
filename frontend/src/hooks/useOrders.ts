import {useState, useCallback, useEffect} from 'react';
import {listOrders} from 'src/api/orders';
import {useWebSocket} from './useWebSocket';

export function useStaffOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders();
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useWebSocket('/ws/orders/', msg => {
    if (msg.type === 'order_created') fetchOrders();
  });

  return {orders, loading, fetchOrders};
}
