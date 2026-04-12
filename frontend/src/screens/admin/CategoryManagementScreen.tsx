import React, {useEffect, useState} from 'react';
import {FlatList, View, Text, StyleSheet} from 'react-native';
import {listCategories} from 'src/api/menu';

export default function CategoryManagementScreen() {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { listCategories().then(r => setCats(r.data)); }, []);
  return (
    <FlatList
      data={cats}
      keyExtractor={c => String(c.id)}
      renderItem={({item}) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.order}>Sort: {item.sort_order}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  name: {fontSize: 16},
  order: {color: '#888'},
});
