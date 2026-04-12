import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {getOrder, updateOrderStatus} from 'src/api/orders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

const NEXT_STATUS: Record<string, string> = {
  pending: 'preparing',
  preparing: 'completed',
};

export default function OrderDetailScreen({route, navigation}: any) {
  const {orderId} = route.params;
  const [order, setOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const load = () => getOrder(orderId).then(res => setOrder(res.data));
  useEffect(() => { load(); }, [orderId]);

  const handleAdvance = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, next);
      await load();
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Table {order.table_number} — Order #{order.id}</Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <FlatList
        data={order.orderitems}
        keyExtractor={(i: any) => String(i.id)}
        renderItem={({item}: any) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.quantity}x {item.item_name}</Text>
            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${order.total_amount}</Text>
        {NEXT_STATUS[order.status] && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleAdvance} disabled={updating}>
            <Text style={styles.actionBtnText}>{updating ? 'Updating...' : `Mark as ${NEXT_STATUS[order.status]}`}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'completed' && (
          <TouchableOpacity style={[styles.actionBtn, styles.checkoutBtn]} onPress={() => navigation.navigate('Checkout', {orderId})}>
            <Text style={styles.actionBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  title: {fontSize: 16, fontWeight: 'bold'},
  itemRow: {flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#f0f0f0'},
  itemName: {fontSize: 15},
  itemPrice: {fontWeight: '600'},
  footer: {padding: 16, borderTopWidth: 1, borderColor: '#eee'},
  total: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  actionBtn: {backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8},
  checkoutBtn: {backgroundColor: '#7ED321'},
  actionBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
});
