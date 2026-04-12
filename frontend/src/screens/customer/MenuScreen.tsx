import React, {useEffect, useState} from 'react';
import {View, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {listCategories, listItems} from 'src/api/menu';
import MenuItemCard from 'src/components/MenuItemCard';

export default function MenuScreen({navigation}: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    listItems(selectedCat ? {category: selectedCat} : undefined)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  }, [selectedCat]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={[{id: null, name: 'All'}, ...categories]}
        keyExtractor={c => String(c.id)}
        renderItem={({item: cat}) => (
          <TouchableOpacity
            style={[styles.catBtn, selectedCat === cat.id && styles.catBtnActive]}
            onPress={() => setSelectedCat(cat.id)}>
            <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        )}
        style={styles.catList}
        showsHorizontalScrollIndicator={false}
      />
      {loading ? (
        <ActivityIndicator style={{flex: 1}} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => (
            <MenuItemCard item={item} onPress={() => navigation.navigate('MenuItemDetail', {itemId: item.id})} />
          )}
        />
      )}
      <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
        <Text style={styles.cartBtnText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  catList: {maxHeight: 52, paddingHorizontal: 12, paddingVertical: 8},
  catBtn: {paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eee', marginRight: 8},
  catBtnActive: {backgroundColor: '#E84545'},
  catText: {color: '#333'},
  catTextActive: {color: '#fff', fontWeight: 'bold'},
  cartBtn: {backgroundColor: '#E84545', margin: 16, padding: 14, borderRadius: 8, alignItems: 'center'},
  cartBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
