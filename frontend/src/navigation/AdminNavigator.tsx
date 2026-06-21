import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TouchableOpacity, Text} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import AdminDashboardScreen from 'src/screens/admin/AdminDashboardScreen';
import MenuManagementScreen from 'src/screens/admin/MenuManagementScreen';
import MenuItemFormScreen from 'src/screens/admin/MenuItemFormScreen';
import CategoryManagementScreen from 'src/screens/admin/CategoryManagementScreen';
import OrderHistoryScreen from 'src/screens/admin/OrderHistoryScreen';
import UserManagementScreen from 'src/screens/admin/UserManagementScreen';
import StatsScreen from 'src/screens/admin/StatsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator({onLogout}: {onLogout?: () => void}) {
  const {logout} = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <Stack.Navigator initialRouteName="AdminDashboard">
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Admin',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{color: '#8B0000', fontWeight: '600'}}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="MenuManagement" component={MenuManagementScreen} options={{title: 'Menu'}} />
      <Stack.Screen name="MenuItemForm" component={MenuItemFormScreen} options={{title: 'Menu Item'}} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{title: 'Categories'}} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{title: 'Order History'}} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{title: 'Users'}} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{title: 'Revenue'}} />
    </Stack.Navigator>
  );
}
