import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl} from 'react-native';
import {listTables, toggleTableStatus} from 'src/api/tables';

interface TableInfo {
  id: number;
  table_number: number;
  daily_code: string;
  status: string;
}

export default function StaffTablesScreen({navigation}: any) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      const res = await listTables();
      setTables(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  const handleToggle = async (tableId: number) => {
    try {
      await toggleTableStatus(tableId);
      await fetchTables();
    } catch {}
  };

  const statusColor = (s: string) => {
    if (s === 'available') return '#4CAF50';
    if (s === 'occupied') return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.ordersBtn} onPress={() => navigation.navigate('OrderList')}>
        <Text style={styles.ordersBtnText}>View All Orders</Text>
      </TouchableOpacity>

      <FlatList
        data={tables}
        keyExtractor={item => String(item.table_number)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        numColumns={2}
        renderItem={({item}) => (
          <View style={styles.tableCard}>
            <Text style={styles.tableNum}>Table {item.table_number}</Text>
            <Text style={[styles.status, {color: statusColor(item.status)}]}>
              {item.status.toUpperCase()}
            </Text>
            <Text style={styles.code}>Code: {item.daily_code}</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, {backgroundColor: item.status === 'available' ? '#FF9800' : '#4CAF50'}]}
              onPress={() => handleToggle(item.id)}>
              <Text style={styles.toggleBtnText}>
                {item.status === 'available' ? 'Set Occupied' : 'Set Available'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF9F0'},
  ordersBtn: {backgroundColor: '#8B0000', margin: 12, padding: 14, borderRadius: 8, alignItems: 'center'},
  ordersBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
  list: {padding: 8},
  tableCard: {flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e0d8cc'},
  tableNum: {fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4},
  status: {fontSize: 12, fontWeight: '700', marginBottom: 4},
  code: {fontSize: 18, fontWeight: '800', color: '#8B0000', letterSpacing: 2, marginTop: 4},
  toggleBtn: {marginTop: 8, padding: 6, borderRadius: 4, alignItems: 'center'},
  toggleBtnText: {color: '#fff', fontSize: 12, fontWeight: '600'},
});
