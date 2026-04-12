import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {listOrders} from 'src/api/orders';
import {useTable} from 'src/context/TableContext';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderStatusScreen({navigation}: any) {
  const {sessionId} = useTable();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    listOrders({session: sessionId})
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={o => String(o.id)}
        renderItem={({item: order}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <OrderStatusBadge status={order.status} />
            </View>
            {order.orderitems.map((oi: any) => (
              <Text key={oi.id} style={styles.itemLine}>{oi.quantity}x {oi.item_name} — ${oi.price}</Text>
            ))}
            <Text style={styles.total}>Total: ${order.total_amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      />
      <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Menu')}>
        <Text style={styles.menuBtnText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  card: {backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 8},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  orderId: {fontSize: 16, fontWeight: 'bold'},
  itemLine: {fontSize: 14, color: '#555', marginBottom: 4},
  total: {fontSize: 15, fontWeight: 'bold', marginTop: 8},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
  menuBtn: {margin: 16, padding: 14, backgroundColor: '#E84545', borderRadius: 8, alignItems: 'center'},
  menuBtnText: {color: '#fff', fontWeight: 'bold'},
});
