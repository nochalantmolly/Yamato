import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TouchableOpacity, Text} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import OrderListScreen from 'src/screens/staff/OrderListScreen';
import OrderDetailScreen from 'src/screens/staff/OrderDetailScreen';
import CheckoutScreen from 'src/screens/staff/CheckoutScreen';
import StaffTablesScreen from 'src/screens/staff/StaffTablesScreen';

export type StaffStackParams = {
  StaffTables: undefined;
  OrderList: undefined;
  OrderDetail: {orderId: number};
  Checkout: {orderId: number};
};

const Stack = createNativeStackNavigator<StaffStackParams>();

export default function StaffNavigator({onLogout}: {onLogout?: () => void}) {
  const {logout} = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <Stack.Navigator initialRouteName="StaffTables">
      <Stack.Screen
        name="StaffTables"
        component={StaffTablesScreen}
        options={{
          title: 'Tables',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{color: '#8B0000', fontWeight: '600'}}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{title: 'Orders'}} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title: 'Order Detail'}} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{title: 'Checkout'}} />
    </Stack.Navigator>
  );
}
