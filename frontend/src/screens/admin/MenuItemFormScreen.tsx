import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import {listCategories, getItem, createItem, updateItem} from 'src/api/menu';

export default function MenuItemFormScreen({route, navigation}: any) {
  const itemId = route.params?.itemId;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCategories().then(r => setCategories(r.data));
    if (itemId) {
      getItem(itemId).then(r => {
        const d = r.data;
        setName(d.name);
        setDescription(d.description || '');
        setPrice(String(d.price));
        setImage(d.image || '');
        setCategoryId(d.category);
      });
    }
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !categoryId) {
      Alert.alert('Error', 'Name, price, and category are required.');
      return;
    }
    setLoading(true);
    try {
      const data = {name: name.trim(), description: description.trim(), price, image: image.trim(), category: categoryId};
      if (itemId) {
        await updateItem(itemId, data);
      } else {
        await createItem(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item name" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" multiline />

      <Text style={styles.label}>Price</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />

      <Text style={styles.label}>Image URL</Text>
      <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." />

      <Text style={styles.label}>Category</Text>
      <View style={styles.catRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catBtn, categoryId === c.id && styles.catBtnActive]}
            onPress={() => setCategoryId(c.id)}>
            <Text style={[styles.catText, categoryId === c.id && styles.catTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : itemId ? 'Update Item' : 'Add Item'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 16},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15},
  catRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4},
  catBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee'},
  catBtnActive: {backgroundColor: '#E84545'},
  catText: {color: '#333', fontSize: 13},
  catTextActive: {color: '#fff', fontWeight: 'bold'},
  saveBtn: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40},
  saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
