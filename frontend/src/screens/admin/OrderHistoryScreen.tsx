import React, {useEffect, useState, useCallback} from 'react';
import {FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {listOrders, updateOrderStatus} from 'src/api/orders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

function formatTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

const NEXT_STATUS: Record<string, {label: string; next: string}> = {
  pending: {label: 'Start Preparing', next: 'preparing'},
  preparing: {label: 'Mark Ready', next: 'completed'},
};

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    listOrders().then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      fetchOrders();
    } catch {
      Alert.alert('Error', 'Could not update order status.');
    }
  };

  if (loading && orders.length === 0) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      onRefresh={fetchOrders}
      refreshing={loading}
      renderItem={({item: o}) => {
        const action = NEXT_STATUS[o.status];
        return (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.title}>Table {o.table_number} — Order #{o.id}</Text>
              <Text style={styles.meta}>{o.orderitems?.length} items · ${o.total_amount}</Text>
              <Text style={styles.time}>Ordered: {formatTime(o.created_at)}</Text>
              {o.completed_at && <Text style={styles.time}>Ready: {formatTime(o.completed_at)}</Text>}
            </View>
            <View style={styles.actions}>
              <OrderStatusBadge status={o.status} />
              {action && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleStatusChange(o.id, action.next)}>
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>No order history.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  info: {flex: 1},
  title: {fontWeight: 'bold', fontSize: 15},
  meta: {color: '#888', marginTop: 4},
  time: {color: '#666', fontSize: 12, marginTop: 2},
  actions: {alignItems: 'flex-end', gap: 8},
  actionBtn: {backgroundColor: '#8B0000', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginTop: 6},
  actionBtnText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
});
