import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {getItem} from 'src/api/menu';
import {addCartItem} from 'src/api/cart';
import {useTable} from 'src/context/TableContext';

export default function MenuItemDetailScreen({route, navigation}: any) {
  const {itemId} = route.params;
  const {sessionId} = useTable();
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getItem(itemId).then(res => setItem(res.data));
  }, [itemId]);

  const handleAdd = async () => {
    if (!sessionId) {
      Alert.alert('No table', 'You have not joined a table yet.');
      return;
    }
    setAdding(true);
    try {
      await addCartItem({session: sessionId, menu_item: itemId, quantity});
      Alert.alert('Added', `${item.name} added to cart.`, [
        {text: 'Keep browsing'},
        {text: 'View Cart', onPress: () => navigation.navigate('Cart')},
      ]);
    } catch {
      Alert.alert('Error', 'Could not add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (!item) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.qtyRow}>
        <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{quantity}</Text>
        <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
        <Text style={styles.addBtnText}>{adding ? 'Adding...' : `Add to Cart — $${(item.price * quantity).toFixed(2)}`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  price: {fontSize: 20, color: '#E84545', marginBottom: 16},
  desc: {fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 32},
  qtyRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  qtyBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'},
  qtyBtnText: {fontSize: 22, fontWeight: 'bold'},
  qty: {fontSize: 20, fontWeight: 'bold', marginHorizontal: 24},
  addBtn: {backgroundColor: '#E84545', padding: 16, borderRadius: 8, alignItems: 'center'},
  addBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
