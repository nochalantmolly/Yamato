import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import {useAuth} from 'src/context/AuthContext';

export default function RegisterScreen({navigation}: any) {
  const {register} = useAuth();
  const [form, setForm] = useState({email: '', password: '', name: '', phone: ''});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({...f, [key]: val}));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.name) {
      Alert.alert('Error', 'Email, password, and name are required.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (e: any) {
      const msg = e.response?.data?.email?.[0] || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={set('name')} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set('email')} />
      <TextInput style={styles.input} placeholder="Phone (optional)" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password (min 8 characters)" secureTextEntry={!showPassword} value={form.password} onChangeText={set('password')} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flexGrow: 1, justifyContent: 'center', padding: 24},
  title: {fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24},
  input: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12},
  passwordContainer: {flexDirection: 'row', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, alignItems: 'center'},
  passwordInput: {flex: 1, padding: 12},
  eyeButton: {paddingHorizontal: 12},
  eyeText: {color: '#888', fontWeight: '600'},
  button: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  link: {textAlign: 'center', marginTop: 16, color: '#666'},
});
