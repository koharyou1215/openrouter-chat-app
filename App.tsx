import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PromptsScreen from './src/screens/PromptsScreen';
import PromptDrawerContent from './src/components/PromptDrawerContent';
import { ChatProvider } from './src/contexts/ChatContext';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <PaperProvider>
      <ChatProvider>
        <NavigationContainer>
          <Drawer.Navigator
            initialRouteName="Chat"
            drawerContent={(props) => <PromptDrawerContent {...props} />}
            screenOptions={{
              headerStyle: { backgroundColor: '#6200ee' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Drawer.Screen name="Chat" component={ChatScreen} options={{ title: 'OpenRouter Chat' }} />
            <Drawer.Screen name="Prompts" component={PromptsScreen} options={{ title: 'カスタムプロンプト' }} />
            <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
          </Drawer.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </ChatProvider>
    </PaperProvider>
  );
}