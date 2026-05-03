import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Switch} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {listItems, deleteItem, toggleItem} from 'src/api/menu';

export default function MenuManagementScreen({navigation}: any) {
  const [items, setItems] = useState<any[]>([]);

  const load = () => listItems().then(res => setItems(res.data));
  useFocusEffect(useCallback(() => { load(); }, []));

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
            <TouchableOpacity style={styles.info} onPress={() => navigation.navigate('MenuItemForm', {itemId: item.id})}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </TouchableOpacity>
            <Switch value={item.is_available} onValueChange={async () => { await toggleItem(item.id); load(); }} />
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.del}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MenuItemForm')}>
          <Text style={styles.btnText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('CategoryManagement')}>
          <Text style={styles.btnText}>Categories</Text>
        </TouchableOpacity>
      </View>
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
  btnRow: {flexDirection: 'row', margin: 16, gap: 12},
  primaryBtn: {flex: 1, backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  secondaryBtn: {flex: 1, backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center'},
  btnText: {color: '#fff', fontWeight: 'bold'},
});
