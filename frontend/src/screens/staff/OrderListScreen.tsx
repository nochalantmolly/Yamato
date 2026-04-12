import React from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {useStaffOrders} from 'src/hooks/useOrders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderListScreen({navigation}: any) {
  const {orders, loading, fetchOrders} = useStaffOrders();

  if (loading && orders.length === 0) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      onRefresh={fetchOrders}
      refreshing={loading}
      renderItem={({item: order}) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('OrderDetail', {orderId: order.id})}>
          <View style={styles.info}>
            <Text style={styles.table}>Table {order.table_number}</Text>
            <Text style={styles.meta}>{order.orderitems.length} items · ${order.total_amount}</Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No active orders</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  info: {flex: 1},
  table: {fontSize: 16, fontWeight: 'bold'},
  meta: {color: '#888', marginTop: 4},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
});
