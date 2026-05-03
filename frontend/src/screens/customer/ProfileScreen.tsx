import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import {updateProfile} from 'src/api/auth';

export default function ProfileScreen() {
  const {user, logout, refreshUser} = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({name: name.trim(), phone: phone.trim()});
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  return (
    <View style={styles.container}>
      {editing ? (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <View style={styles.editBtnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone || 'No phone number'}</Text>
          <Text style={styles.role}>{user?.role}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  email: {color: '#666', marginBottom: 4},
  phone: {color: '#666', marginBottom: 4},
  role: {color: '#888', marginBottom: 24, textTransform: 'capitalize'},
  label: {fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15},
  editBtnRow: {flexDirection: 'row', gap: 12, marginTop: 20},
  saveBtn: {flex: 1, backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  cancelBtn: {flex: 1, backgroundColor: '#eee', padding: 14, borderRadius: 8, alignItems: 'center'},
  cancelBtnText: {color: '#333', fontWeight: 'bold', fontSize: 16},
  editProfileBtn: {backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12},
  editProfileBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  logoutBtn: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 'auto'},
  logoutText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
