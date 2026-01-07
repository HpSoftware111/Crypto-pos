import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PaymentMethodScreen from '../screens/PaymentMethodScreen';
import AmountInputScreen from '../screens/AmountInputScreen';
import PaymentDisplayScreen from '../screens/PaymentDisplayScreen';
import { COLORS } from '../utils/config';

const Stack = createStackNavigator();

/**
 * AppNavigator
 * Main navigation structure for the app
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PaymentMethod"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.surface,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="PaymentMethod"
          component={PaymentMethodScreen}
          options={{
            title: 'Crypto POS',
            headerShown: false, // Custom header in screen
          }}
        />
        <Stack.Screen
          name="AmountInput"
          component={AmountInputScreen}
          options={{
            title: 'Enter Amount',
          }}
        />
        <Stack.Screen
          name="PaymentDisplay"
          component={PaymentDisplayScreen}
          options={{
            title: 'Payment Request',
            headerLeft: null, // Prevent back navigation
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

