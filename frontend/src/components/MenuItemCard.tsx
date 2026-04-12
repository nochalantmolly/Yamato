import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface Props {
  item: {id: number; name: string; description: string; price: string};
  onPress: () => void;
}

export default function MenuItemCard({item, onPress}: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      </View>
      <Text style={styles.price}>${item.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 16, fontWeight: '600'},
  desc: {color: '#888', marginTop: 4, fontSize: 13},
  price: {fontSize: 16, fontWeight: 'bold', color: '#E84545', marginLeft: 12},
});
