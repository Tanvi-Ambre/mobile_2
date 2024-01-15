// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RegistrationScreen from './screens/RegisterationScreens'; // Update this path
import LoginScreen from './screens/LoginScreen';
import VoterDashboard from './components/VoterDashboard';
import ElectionDashboard from './components/ElectionDashboard';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="VoterDashboard" component={VoterDashboard} />
        <Stack.Screen name="ElectionDashboard" component={ElectionDashboard} />
        {/* Add other screens here as needed */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
