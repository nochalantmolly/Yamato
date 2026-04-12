import React, {useEffect, useState} from 'react';
import {FlatList, View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {listOrders} from 'src/api/orders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders().then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      renderItem={({item: o}) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.title}>Table {o.table_number} — Order #{o.id}</Text>
            <Text style={styles.meta}>{o.orderitems?.length} items · ${o.total_amount}</Text>
          </View>
          <OrderStatusBadge status={o.status} />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No order history.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  info: {flex: 1},
  title: {fontWeight: 'bold', fontSize: 15},
  meta: {color: '#888', marginTop: 4},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
});
