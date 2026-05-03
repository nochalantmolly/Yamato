import React, {useState, useCallback} from 'react';
import {FlatList, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {listCategories, createCategory, updateCategory, deleteCategory} from 'src/api/menu';

export default function CategoryManagementScreen() {
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => listCategories().then(r => setCats(r.data));
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required.'); return; }
    try {
      if (editingId) {
        await updateCategory(editingId, {name: name.trim(), sort_order: Number(sortOrder)});
      } else {
        await createCategory({name: name.trim(), sort_order: Number(sortOrder)});
      }
      setName('');
      setSortOrder('0');
      setEditingId(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save.');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSortOrder(String(cat.sort_order));
  };

  const handleDelete = (id: number, catName: string) => {
    Alert.alert('Delete', `Delete "${catName}"? Items in this category will also be deleted.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(id); load(); }},
    ]);
  };

  const cancelEdit = () => { setEditingId(null); setName(''); setSortOrder('0'); };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Category name" />
        <TextInput style={styles.sortInput} value={sortOrder} onChangeText={setSortOrder} placeholder="Sort" keyboardType="number-pad" />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
        {editingId && (
          <TouchableOpacity onPress={cancelEdit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={cats}
        keyExtractor={c => String(c.id)}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.catName}>{item.name}</Text>
              <Text style={styles.order}>Sort: {item.sort_order}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.delBtn}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  form: {flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee', gap: 8},
  input: {flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15},
  sortInput: {width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, textAlign: 'center'},
  saveBtn: {backgroundColor: '#E84545', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8},
  saveBtnText: {color: '#fff', fontWeight: 'bold'},
  cancelText: {color: '#888', fontSize: 13},
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  catName: {fontSize: 16, fontWeight: '500'},
  order: {color: '#888', fontSize: 13},
  editBtn: {marginRight: 12},
  editText: {color: '#4A90E2', fontWeight: '500'},
  delBtn: {},
  delText: {color: '#E84545', fontWeight: '500'},
});
