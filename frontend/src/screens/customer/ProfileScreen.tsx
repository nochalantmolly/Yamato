import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useAuth} from 'src/context/AuthContext';

export default function ProfileScreen() {
  const {user, logout} = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  email: {color: '#666', marginBottom: 4},
  role: {color: '#888', marginBottom: 32, textTransform: 'capitalize'},
  logoutBtn: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  logoutText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
