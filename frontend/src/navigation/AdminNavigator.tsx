import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MenuManagementScreen from 'src/screens/admin/MenuManagementScreen';
import CategoryManagementScreen from 'src/screens/admin/CategoryManagementScreen';
import OrderHistoryScreen from 'src/screens/admin/OrderHistoryScreen';
import UserManagementScreen from 'src/screens/admin/UserManagementScreen';
import StatsScreen from 'src/screens/admin/StatsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="MenuManagement">
      <Stack.Screen name="MenuManagement" component={MenuManagementScreen} options={{title: 'Menu'}} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{title: 'Categories'}} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{title: 'Order History'}} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{title: 'Users'}} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{title: 'Statistics'}} />
    </Stack.Navigator>
  );
}
