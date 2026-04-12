import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OrderListScreen from 'src/screens/staff/OrderListScreen';
import OrderDetailScreen from 'src/screens/staff/OrderDetailScreen';
import CheckoutScreen from 'src/screens/staff/CheckoutScreen';

export type StaffStackParams = {
  OrderList: undefined;
  OrderDetail: {orderId: number};
  Checkout: {orderId: number};
};

const Stack = createNativeStackNavigator<StaffStackParams>();

export default function StaffNavigator() {
  return (
    <Stack.Navigator initialRouteName="OrderList">
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{title: 'Orders'}} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title: 'Order Detail'}} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{title: 'Checkout'}} />
    </Stack.Navigator>
  );
}
