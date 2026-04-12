import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import client from 'src/api/client';

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    client.get('/orders/stats/').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Stats</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total Orders</Text>
        <Text style={styles.value}>{stats.order_count}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Revenue</Text>
        <Text style={styles.value}>${stats.total_revenue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#f5f5f5'},
  title: {fontSize: 22, fontWeight: 'bold', marginBottom: 20},
  card: {backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 12},
  label: {color: '#888', fontSize: 14},
  value: {fontSize: 28, fontWeight: 'bold', marginTop: 4},
});
