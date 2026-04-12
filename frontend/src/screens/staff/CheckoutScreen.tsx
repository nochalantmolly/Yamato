import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {checkout} from 'src/api/orders';

export default function CheckoutScreen({route, navigation}: any) {
  const {orderId} = route.params;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await checkout(orderId);
      Alert.alert('Done', 'Payment confirmed. Table is now available.', [
        {text: 'OK', onPress: () => navigation.popToTop()},
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Checkout failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Payment</Text>
      <Text style={styles.sub}>Once confirmed, the table will be reset for the next group.</Text>
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
        <Text style={styles.confirmBtnText}>{loading ? 'Processing...' : 'Confirm Payment'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 32, alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 12},
  sub: {textAlign: 'center', color: '#666', marginBottom: 40, lineHeight: 22},
  confirmBtn: {backgroundColor: '#7ED321', padding: 18, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 16},
  confirmBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  cancel: {color: '#888', fontSize: 15},
});
