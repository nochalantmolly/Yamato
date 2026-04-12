import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from 'src/context/AuthContext';
import {TableProvider} from 'src/context/TableContext';
import AppNavigator from 'src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TableProvider>
          <AppNavigator />
        </TableProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
