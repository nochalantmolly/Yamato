import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const COLORS: Record<string, string> = {
  pending: '#F5A623',
  preparing: '#4A90E2',
  completed: '#7ED321',
  paid: '#9B9B9B',
};

export default function OrderStatusBadge({status}: {status: string}) {
  return (
    <View style={[styles.badge, {backgroundColor: COLORS[status] || '#ccc'}]}>
      <Text style={styles.text}>{status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start'},
  text: {color: '#fff', fontSize: 11, fontWeight: 'bold'},
});
