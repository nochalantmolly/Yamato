import {useState, useCallback, useEffect} from 'react';
import {getCart} from 'src/api/cart';
import {useWebSocket} from './useWebSocket';
import {useTable} from 'src/context/TableContext';

export function useCart() {
  const {sessionId} = useTable();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await getCart(sessionId);
      setCartItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const wsPath = sessionId ? `/ws/table/${sessionId}/` : null;
  useWebSocket(wsPath, msg => {
    if (msg.type === 'cart_updated') fetchCart();
  });

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.item_price) * item.quantity, 0);

  return {cartItems, loading, fetchCart, total};
}
