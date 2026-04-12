import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Switch} from 'react-native';
import {listItems, deleteItem, toggleItem} from 'src/api/menu';

export default function MenuManagementScreen({navigation}: any) {
  const [items, setItems] = useState<any[]>([]);

  const load = () => listItems().then(res => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem(id); load(); }},
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        onRefresh={load}
        refreshing={false}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <Switch value={item.is_available} onValueChange={async () => { await toggleItem(item.id); load(); }} />
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.del}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CategoryManagement')}>
        <Text style={styles.addBtnText}>Manage Categories</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '500'},
  price: {color: '#888', fontSize: 13},
  del: {marginLeft: 12},
  delText: {color: '#E84545'},
  addBtn: {margin: 16, backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center'},
  addBtnText: {color: '#fff', fontWeight: 'bold'},
});
