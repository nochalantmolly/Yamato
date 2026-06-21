import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const bgTop = require('src/assets/bg-role-selection.png');
const bgBottom = require('src/assets/bg-role-selection-2.png');

export default function RoleSelectionScreen({onEnter}: {
  onEnter: () => void;
}) {
  return (
    <View style={styles.container}>
      <Image source={bgTop} style={styles.bgTop} resizeMode="cover" />
      <Image source={bgBottom} style={styles.bgBottom} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'transparent']}
        style={styles.blendGradient}
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>YAMATO</Text>
          <Text style={styles.subtitle}>Asian Restaurant</Text>
        </View>

        <TouchableOpacity style={styles.enterBtn} onPress={onEnter}>
          <Text style={styles.enterBtnText}>Enter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  bgTop: {position: 'absolute', top: 0, left: 0, right: 0, height: '55%', width: '100%'},
  bgBottom: {position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', width: '100%'},
  blendGradient: {position: 'absolute', top: '40%', left: 0, right: 0, height: '20%', zIndex: 1},
  overlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2},
  content: {flex: 1, justifyContent: 'center', padding: 32, zIndex: 3},
  header: {alignItems: 'center', marginBottom: 60},
  title: {fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: 6},
  subtitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, letterSpacing: 2},
  enterBtn: {backgroundColor: '#8B0000', padding: 20, borderRadius: 12, alignItems: 'center'},
  enterBtnText: {color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 2},
});
