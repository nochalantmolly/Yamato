import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {useCart} from 'src/hooks/useCart';
import {useTable} from 'src/context/TableContext';
import {submitOrder} from 'src/api/orders';
import CartItemRow from 'src/components/CartItemRow';

export default function CartScreen({navigation}: any) {
  const {sessionId, tableNumber} = useTable();
  const {cartItems, loading, fetchCart, total} = useCart();
  const [submitting, setSubmitting] = useState(false);

  const hasUnavailable = cartItems.some(i => i.item_unavailable);

  const handleSubmit = async () => {
    if (hasUnavailable) {
      Alert.alert('Remove unavailable items', 'Please remove unavailable items before submitting.');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Empty cart', 'Add items before placing an order.');
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder(sessionId!);
      Alert.alert('Order placed!', 'Your order has been sent to the kitchen.', [
        {text: 'OK', onPress: () => navigation.navigate('OrderStatus')},
      ]);
    } catch {
      Alert.alert('Error', 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Table {tableNumber} — Cart</Text>
      {cartItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.link}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={i => String(i.id)}
            renderItem={({item}) => <CartItemRow item={item} onChanged={fetchCart} />}
          />
          <View style={styles.footer}>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.orderBtn, hasUnavailable && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting || hasUnavailable}>
              <Text style={styles.orderBtnText}>{submitting ? 'Placing order...' : 'Place Order'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {fontSize: 18, fontWeight: 'bold', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: 16, color: '#888', marginBottom: 12},
  link: {color: '#E84545', fontSize: 16},
  footer: {padding: 16, borderTopWidth: 1, borderColor: '#eee'},
  total: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  orderBtn: {backgroundColor: '#E84545', padding: 16, borderRadius: 8, alignItems: 'center'},
  disabledBtn: {backgroundColor: '#ccc'},
  orderBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
