import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {updateCartItem, deleteCartItem} from 'src/api/cart';

interface Props {
  item: {id: number; item_name: string; item_price: string; quantity: number; item_unavailable: boolean};
  onChanged: () => void;
}

export default function CartItemRow({item, onChanged}: Props) {
  const handleQty = async (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await deleteCartItem(item.id);
    } else {
      await updateCartItem(item.id, newQty);
    }
    onChanged();
  };

  return (
    <View style={[styles.row, item.item_unavailable && styles.unavailable]}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.item_name}</Text>
        {item.item_unavailable && <Text style={styles.warn}>Item no longer available</Text>}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => handleQty(-1)} style={styles.btn}><Text style={styles.btnText}>-</Text></TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => handleQty(1)} style={styles.btn}><Text style={styles.btnText}>+</Text></TouchableOpacity>
      </View>
      <Text style={styles.price}>${(parseFloat(item.item_price) * item.quantity).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee'},
  unavailable: {opacity: 0.5},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '500'},
  warn: {color: '#E84545', fontSize: 12, marginTop: 2},
  controls: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 12},
  btn: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'},
  btnText: {fontSize: 18, fontWeight: 'bold'},
  qty: {fontSize: 16, fontWeight: 'bold', marginHorizontal: 10},
  price: {fontSize: 15, fontWeight: '600', color: '#333', width: 64, textAlign: 'right'},
});
