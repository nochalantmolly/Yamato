import React, {useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, View} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import LoginScreen from 'src/screens/auth/LoginScreen';
import RoleSelectionScreen from 'src/screens/RoleSelectionScreen';
import LoginChoiceScreen from 'src/screens/LoginChoiceScreen';
import CustomerNavigator from './CustomerNavigator';
import StaffNavigator from './StaffNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

type AppMode = 'splash' | 'login_choice' | 'customer' | 'staff_login' | 'admin_login';

export default function AppNavigator() {
  const {user, isLoading} = useAuth();
  const [mode, setMode] = useState<AppMode>('splash');

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" /></View>;
  }

  // If logged in as staff/admin, go directly to their navigator
  if (user && user.role === 'staff') {
    return (
      <NavigationContainer>
        <StaffNavigator onLogout={() => setMode('splash')} />
      </NavigationContainer>
    );
  }
  if (user && user.role === 'admin') {
    return (
      <NavigationContainer>
        <AdminNavigator onLogout={() => setMode('splash')} />
      </NavigationContainer>
    );
  }

  // Customer mode (anonymous)
  if (mode === 'customer') {
    return (
      <NavigationContainer>
        <CustomerNavigator onBack={() => setMode('login_choice')} />
      </NavigationContainer>
    );
  }

  // Staff/Admin login
  if (mode === 'staff_login' || mode === 'admin_login') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onBack={() => setMode('login_choice')} expectedRole={mode === 'staff_login' ? 'staff' : 'admin'} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Login choice screen
  if (mode === 'login_choice') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="LoginChoice">
            {() => (
              <LoginChoiceScreen
                onStaff={() => setMode('staff_login')}
                onAdmin={() => setMode('admin_login')}
                onSkip={() => setMode('customer')}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Splash / welcome screen
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="RoleSelection">
          {() => (
            <RoleSelectionScreen
              onEnter={() => setMode('login_choice')}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
