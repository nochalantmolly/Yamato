import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {joinTable} from 'src/api/tables';
import {useTable} from 'src/context/TableContext';

export default function TableJoinScreen({navigation, onBack}: any) {
  const {joinSession} = useTable();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length !== 4) {
      Alert.alert('Error', 'Please enter a 4-character table code.');
      return;
    }
    setLoading(true);
    try {
      const res = await joinTable(code.toUpperCase());
      joinSession(res.data.session_id, res.data.table_number, res.data.session_token);
      navigation.replace('Menu');
    } catch (e: any) {
      const msg = e.response?.status === 404 ? 'Invalid or expired code.' : 'Could not join table.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Table Code</Text>
      <Text style={styles.subtitle}>Enter the 4-character code displayed at your table</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. A3F7"
        autoCapitalize="characters"
        maxLength={4}
        value={code}
        onChangeText={setCode}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Table'}</Text>
      </TouchableOpacity>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center', backgroundColor: '#FFF9F0'},
  title: {fontSize: 24, fontWeight: 'bold', color: '#8B0000', marginBottom: 8},
  subtitle: {color: '#666', marginBottom: 32, textAlign: 'center'},
  input: {borderWidth: 2, borderColor: '#8B0000', borderRadius: 8, padding: 16, fontSize: 24, letterSpacing: 8, textAlign: 'center', width: 200, marginBottom: 24, backgroundColor: '#fff'},
  button: {backgroundColor: '#8B0000', padding: 14, borderRadius: 8, width: 200, alignItems: 'center'},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  backBtn: {marginTop: 20},
  backText: {color: '#8B0000', fontSize: 15, fontWeight: '600'},
});
