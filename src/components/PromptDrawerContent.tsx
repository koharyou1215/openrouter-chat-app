import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useChat } from '../contexts/ChatContext';
import { Switch, Button } from 'react-native-paper';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const PromptDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { customPrompts, updateCustomPrompt } = useChat();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <Text style={styles.title}>カスタムプロンプト</Text>
      {customPrompts.map((prompt) => (
        <View key={prompt.id} style={styles.promptRow}>
          <Text style={styles.promptName}>{prompt.name}</Text>
          <Switch
            value={prompt.isActive}
            onValueChange={() => updateCustomPrompt(prompt.id, { isActive: !prompt.isActive })}
          />
        </View>
      ))}

      <Button
        mode="outlined"
        onPress={() => props.navigation.navigate('Prompts')}
        style={styles.manageButton}
      >
        プロンプトを管理
      </Button>

      <View style={styles.divider} />
      <Button
        mode="contained"
        onPress={() => props.navigation.navigate('Settings')}
      >
        設定
      </Button>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  promptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptName: {
    fontSize: 16,
    flex: 1,
  },
  manageButton: {
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
});

export default PromptDrawerContent; 