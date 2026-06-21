import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

export default function LoginChoiceScreen({onStaff, onAdmin, onSkip}: {
  onStaff: () => void;
  onAdmin: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>YAMATO</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.loginBtn} onPress={onStaff}>
          <Text style={styles.loginBtnText}>Staff Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={onAdmin}>
          <Text style={styles.loginBtnText}>Admin Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.skipContainer}>
        <Text style={styles.skipLabel}>Just here to order?</Text>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Enter Table Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF9F0', justifyContent: 'center', padding: 32},
  header: {alignItems: 'center', marginBottom: 50},
  title: {fontSize: 32, fontWeight: '800', color: '#8B0000', letterSpacing: 4},
  subtitle: {fontSize: 14, color: '#666', marginTop: 8, letterSpacing: 1},
  buttonGroup: {gap: 16},
  loginBtn: {backgroundColor: '#8B0000', padding: 18, borderRadius: 12, alignItems: 'center'},
  loginBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  skipContainer: {marginTop: 40, alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderColor: '#e0d8cc'},
  skipLabel: {color: '#888', fontSize: 14, marginBottom: 12},
  skipBtn: {backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#8B0000', width: '100%'},
  skipBtnText: {color: '#8B0000', fontSize: 16, fontWeight: '700'},
});
