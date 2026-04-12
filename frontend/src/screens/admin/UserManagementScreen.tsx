import React, {useEffect, useState} from 'react';
import {FlatList, View, Text, StyleSheet} from 'react-native';
import client from 'src/api/client';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { client.get('/auth/users/').then(r => setUsers(r.data)).catch(() => {}); }, []);
  return (
    <FlatList
      data={users}
      keyExtractor={u => String(u.id)}
      renderItem={({item}) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.email} · {item.role}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  name: {fontWeight: 'bold', fontSize: 15},
  meta: {color: '#888', marginTop: 2},
});
