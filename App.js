import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewTaskScreen from './src/screens/NewTaskScreen';
import PendingTasksScreen from './src/screens/PendingTasksScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import CompletedTasksScreen from './src/screens/CompletedTasksScreen';
import UpcomingTasksScreen from './src/screens/UpcomingTasksScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import TestSoundScreen from './src/screens/TestSoundScreen';

// Habilita as screens nativas para melhor performance
enableScreens();

const Stack = createNativeStackNavigator();

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={({ route, navigation }) => ({
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' }
            })}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewTask" component={NewTaskScreen} />
            <Stack.Screen name="PendingTasks" component={PendingTasksScreen} />
            <Stack.Screen name="EditTask" component={EditTaskScreen} />
            <Stack.Screen name="CompletedTasks" component={CompletedTasksScreen} />
            <Stack.Screen name="UpcomingTasks" component={UpcomingTasksScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Calendar" component={CalendarScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TestSound" component={TestSoundScreen} options={{ headerShown: true, title: 'Teste de Sons' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);