import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';

export default function AdminDashboardScreen({navigation}: any) {
  const items = [
    {label: 'Menu Management', screen: 'MenuManagement', desc: 'Add, edit, remove items & pricing'},
    {label: 'Categories', screen: 'CategoryManagement', desc: 'Manage menu categories'},
    {label: 'Revenue & Stats', screen: 'Stats', desc: 'Today, week, month, charts'},
    {label: 'Order History', screen: 'OrderHistory', desc: 'All purchases'},
    {label: 'User Management', screen: 'UserManagement', desc: 'Staff & admin accounts'},
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>YAMATO</Text>
      <Text style={styles.subtitle}>Admin Panel</Text>

      {items.map(item => (
        <TouchableOpacity
          key={item.screen}
          style={styles.card}
          onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardDesc}>{item.desc}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF9F0'},
  content: {padding: 20},
  title: {fontSize: 28, fontWeight: '800', color: '#8B0000', textAlign: 'center', letterSpacing: 4},
  subtitle: {fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, letterSpacing: 2},
  card: {backgroundColor: '#fff', borderRadius: 10, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#e0d8cc'},
  cardLabel: {fontSize: 17, fontWeight: '700', color: '#333'},
  cardDesc: {fontSize: 13, color: '#888', marginTop: 4},
});
