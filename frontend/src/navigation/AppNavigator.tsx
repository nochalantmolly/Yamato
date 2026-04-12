import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, View} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import LoginScreen from 'src/screens/auth/LoginScreen';
import RegisterScreen from 'src/screens/auth/RegisterScreen';
import CustomerNavigator from './CustomerNavigator';
import StaffNavigator from './StaffNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

function RoleNavigator() {
  const {user} = useAuth();
  if (user?.role === 'staff') return <StaffNavigator />;
  if (user?.role === 'admin') return <AdminNavigator />;
  return <CustomerNavigator />;
}

export default function AppNavigator() {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      {user ? (
        <RoleNavigator />
      ) : (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
