import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Switch } from 'react-native-paper';
import { useChat } from '../contexts/ChatContext';

const SettingsScreen: React.FC = () => {
  const { apiKey, selectedModel, setApiKey, setSelectedModel } = useChat();
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempGeminiApiKey, setTempGeminiApiKey] = useState('AIzaSyB6swTTIlDM3pgyALHjZDFTUIQf2fhzLAE');
  const [tempModel, setTempModel] = useState(selectedModel);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);

  const availableModels = [
    // OpenRouter モデル
    { id: 'openai/gpt-4', name: 'GPT-4 (OpenRouter)', type: 'openrouter' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenRouter)', type: 'openrouter' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', type: 'openrouter' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet (OpenRouter)', type: 'openrouter' },
    { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B (OpenRouter)', type: 'openrouter' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera (OpenRouter)', type: 'openrouter' },
    { id: 'x-ai/grok-4', name: 'Grok-4 (OpenRouter)', type: 'openrouter' },
    { id: 'anthropic/claude-3.7-sonnet:thinking', name: 'Claude 3.7 Sonnet Thinking (OpenRouter)', type: 'openrouter' },
    { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4 (OpenRouter)', type: 'openrouter' },
    { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek Chat V3 (OpenRouter)', type: 'openrouter' },
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (OpenRouter)', type: 'openrouter' },
    // Gemini API モデル
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (Gemini API)', type: 'gemini' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Gemini API)', type: 'gemini' },
  ];

  const handleSave = () => {
    const isGeminiModel = tempModel.startsWith('google/gemini');
    
    if (isGeminiModel && !tempGeminiApiKey.trim()) {
      Alert.alert('エラー', 'Gemini APIキーを入力してください');
      return;
    }
    
    if (!isGeminiModel && !tempApiKey.trim()) {
      Alert.alert('エラー', 'OpenRouter APIキーを入力してください');
      return;
    }
    
    setApiKey(tempApiKey.trim());
    setSelectedModel(tempModel);
    Alert.alert('成功', '設定を保存しました');
  };

  const handleTestConnection = async () => {
    if (!tempApiKey.trim()) {
      Alert.alert('エラー', 'APIキーを入力してください');
      return;
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${tempApiKey.trim()}`,
          'HTTP-Referer': 'https://openrouter-chat-app.com',
          'X-Title': 'OpenRouter Chat App',
        },
      });

      if (response.ok) {
        Alert.alert('成功', 'APIキーが有効です');
      } else {
        Alert.alert('エラー', 'APIキーが無効です');
      }
    } catch (error) {
      Alert.alert('エラー', '接続テストに失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>OpenRouter API設定</Title>
          <Paragraph>
            OpenRouterのAPIキーを設定してください。
            APIキーは安全に保存されます。
          </Paragraph>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>APIキー</Text>
            <TextInput
              style={styles.textInput}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="sk-or-v1-..."
              secureTextEntry={!showApiKey}
              mode="outlined"
            />
            <Button
              mode="text"
              onPress={() => setShowApiKey(!showApiKey)}
              style={styles.toggleButton}
            >
              {showApiKey ? '隠す' : '表示'}
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleTestConnection}
              style={styles.button}
            >
              接続テスト
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Gemini API設定</Title>
          <Paragraph>
            Gemini APIのキーを設定してください。
            Gemini系のモデルを使用する際に必要です。
          </Paragraph>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>APIキー</Text>
            <TextInput
              style={styles.textInput}
              value={tempGeminiApiKey}
              onChangeText={setTempGeminiApiKey}
              placeholder="AIzaSy..."
              secureTextEntry={!showGeminiApiKey}
              mode="outlined"
            />
            <Button
              mode="text"
              onPress={() => setShowGeminiApiKey(!showGeminiApiKey)}
              style={styles.toggleButton}
            >
              {showGeminiApiKey ? '隠す' : '表示'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>モデル選択</Title>
          <Paragraph>
            使用するAIモデルを選択してください。
          </Paragraph>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>モデル</Text>
            <TextInput
              style={styles.textInput}
              value={tempModel}
              onChangeText={setTempModel}
              placeholder="openai/gpt-4"
              mode="outlined"
            />
          </View>

          <View style={styles.modelsList}>
            <Text style={styles.sectionTitle}>OpenRouter モデル</Text>
            {availableModels.filter(model => model.type === 'openrouter').map((model) => (
              <Button
                key={model.id}
                mode={tempModel === model.id ? "contained" : "outlined"}
                onPress={() => setTempModel(model.id)}
                style={styles.modelButton}
              >
                {model.name}
              </Button>
            ))}
            
            <Text style={styles.sectionTitle}>Gemini API モデル</Text>
            {availableModels.filter(model => model.type === 'gemini').map((model) => (
              <Button
                key={model.id}
                mode={tempModel === model.id ? "contained" : "outlined"}
                onPress={() => setTempModel(model.id)}
                style={styles.modelButton}
              >
                {model.name}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>使用方法</Title>
          <Paragraph>
            1. OpenRouterのAPIキーを取得してください{'\n'}
            2. 使用したいモデルを選択してください{'\n'}
            3. 接続テストでAPIキーを確認してください{'\n'}
            4. カスタムプロンプトを設定してチャットを開始してください
          </Paragraph>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        disabled={!tempApiKey.trim() && !tempGeminiApiKey.trim()}
      >
        設定を保存
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  inputContainer: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textInput: {
    marginBottom: 5,
  },
  toggleButton: {
    alignSelf: 'flex-end',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    marginVertical: 5,
  },
  modelsList: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#6200ee',
  },
  modelButton: {
    marginVertical: 2,
  },
  saveButton: {
    marginVertical: 20,
    backgroundColor: '#6200ee',
  },
});

export default SettingsScreen; 