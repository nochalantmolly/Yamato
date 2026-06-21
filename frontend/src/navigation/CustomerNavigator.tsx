import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TableJoinScreen from 'src/screens/customer/TableJoinScreen';
import MenuScreen from 'src/screens/customer/MenuScreen';
import MenuItemDetailScreen from 'src/screens/customer/MenuItemDetailScreen';
import CartScreen from 'src/screens/customer/CartScreen';
import OrderStatusScreen from 'src/screens/customer/OrderStatusScreen';

export type CustomerStackParams = {
  TableJoin: undefined;
  Menu: undefined;
  MenuItemDetail: {itemId: number};
  Cart: undefined;
  OrderStatus: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParams>();

export default function CustomerNavigator({onBack}: {onBack?: () => void}) {
  return (
    <Stack.Navigator initialRouteName="TableJoin">
      <Stack.Screen name="TableJoin" options={{title: 'Enter Table Code'}}>
        {(props) => <TableJoinScreen {...props} onBack={onBack} />}
      </Stack.Screen>
      <Stack.Screen name="Menu" component={MenuScreen} options={{title: 'Menu'}} />
      <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} options={{title: 'Item Details'}} />
      <Stack.Screen name="Cart" component={CartScreen} options={{title: 'Cart'}} />
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} options={{title: 'Order Status'}} />
    </Stack.Navigator>
  );
}
