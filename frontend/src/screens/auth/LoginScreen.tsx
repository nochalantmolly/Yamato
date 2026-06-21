import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useAuth} from 'src/context/AuthContext';

interface Props {
  onBack?: () => void;
  expectedRole?: 'staff' | 'admin';
  navigation?: any;
}

export default function LoginScreen({onBack, expectedRole}: Props) {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roleLabel = expectedRole === 'admin' ? 'Admin' : 'Staff';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YAMATO</Text>
      <Text style={styles.roleLabel}>{roleLabel} Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
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
  container: {flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFF9F0'},
  title: {fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#8B0000', letterSpacing: 4, marginBottom: 8},
  roleLabel: {fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 32},
  input: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff'},
  passwordContainer: {flexDirection: 'row', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 16, alignItems: 'center', backgroundColor: '#fff'},
  passwordInput: {flex: 1, padding: 12},
  eyeButton: {paddingHorizontal: 12},
  eyeText: {color: '#888', fontWeight: '600'},
  button: {backgroundColor: '#8B0000', padding: 14, borderRadius: 8, alignItems: 'center'},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  backBtn: {marginTop: 20, alignItems: 'center'},
  backText: {color: '#8B0000', fontSize: 15, fontWeight: '600'},
});
