import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Switch, 
  TextInput, 
  Button,
  Divider,
  List,
  IconButton,
  Avatar,
  Appbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../contexts/ChatContext';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { modelConfigs, updateModelConfig, addModelConfig, deleteModelConfig } = useChat();
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('AIzaSyB6swTTIlDM3pgyALHjZDFTUIQf2fhzLAE');

  const handleToggleModel = (modelId: string) => {
    updateModelConfig(modelId, { isEnabled: !modelConfigs.find(m => m.id === modelId)?.isEnabled });
  };

  // APIキー入力 UI を撤廃したため未使用
  const handleUpdateApiKey = () => {};

  const addNewModel = () => {
    Alert.prompt(
      '新しいモデルを追加',
      'モデルIDを入力してください（例: anthropic/claude-3-sonnet）',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '追加',
          onPress: (modelId) => {
            if (modelId && modelId.trim()) {
              const trimmedId = modelId.trim();
              const name = generateModelName(trimmedId);
              const provider = determineProvider(trimmedId);
              
              const newModel = {
                id: `model-${Date.now()}`,
                name: name,
                provider: provider,
                modelId: trimmedId,
                isEnabled: false,
              };
              addModelConfig(newModel);
              Alert.alert('成功', `${name} を追加しました`);
            } else {
              Alert.alert('エラー', 'モデルIDを入力してください');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  // モデルIDから名前を生成
  const generateModelName = (modelId: string): string => {
    const parts = modelId.split('/');
    const provider = parts[0];
    const model = parts[1] || modelId;
    
    // プロバイダー名のマッピング
    const providerNames: { [key: string]: string } = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'meta': 'Meta',
      'deepseek': 'DeepSeek',
      'x-ai': 'xAI',
      'tngtech': 'TNG Technology',
      'microsoft': 'Microsoft',
    };
    
    const providerName = providerNames[provider] || provider;
    const modelName = model.charAt(0).toUpperCase() + model.slice(1);
    
    return `${modelName} (${providerName})`;
  };

  // モデルIDからプロバイダーを判定
  const determineProvider = (modelId: string): 'openrouter' | 'gemini' => {
    if (modelId.includes('gemini') || modelId.startsWith('google/')) {
      return 'gemini';
    }
    return 'openrouter';
  };

  const removeModel = (modelId: string) => {
    Alert.alert(
      'モデルを削除',
      'このモデルを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => deleteModelConfig(modelId)
        },
      ]
    );
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openrouter':
        return '#1976d2';
      case 'gemini':
        return '#4285f4';
      default:
        return '#666';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openrouter':
        return 'OpenRouter';
      case 'gemini':
        return 'Gemini';
      default:
        return provider;
    }
  };

  // モデルごとのブランドカラーとアイコン
  const getModelBrand = (modelId: string) => {
    if (modelId.includes('gpt-4o')) {
      return { icon: 'robot', color: '#10a37f' };
    }
    if (modelId.includes('claude')) {
      return { icon: 'feather', color: '#f4a261' };
    }
    if (modelId.includes('grok')) {
      return { icon: 'lightbulb', color: '#000' };
    }
    if (modelId.includes('deepseek')) {
      return { icon: 'rocket', color: '#9c27b0' }; // DeepSeek パープル
    }
    if (modelId.includes('gemini')) {
      return { icon: 'star-four-points', color: '#4285f4' }; // Gemini ブルー
    }
    return { icon: 'robot-outline', color: '#666' };
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="設定" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>複数モデル設定</Title>
            <Paragraph>
              複数のAIモデルを同時に使用して、回答を比較できます。
              各モデルの有効/無効を切り替えて、使用するモデルを選択してください。
            </Paragraph>
          </Card.Content>
        </Card>

        {/* モデル設定 */}
        <View style={styles.modelsContainer}>
          {modelConfigs.map((model) => (
            <Card key={model.id} style={styles.modelCard}>
              <Card.Content>
                {(() => {
                  const { icon, color } = getModelBrand(model.id);
                  return (
                    <View style={styles.modelHeader}>
                      <Avatar.Icon
                        icon={icon}
                        size={28}
                        style={{ backgroundColor: color, marginRight: 6 }}
                        color="white"
                      />
                      <View style={styles.modelInfo}>
                        <Title style={styles.modelTitle}>{model.name}</Title>
                        <View style={styles.modelMeta}>
                          <Text style={[styles.providerTag, { backgroundColor: getProviderColor(model.provider) }]}>
                            {getProviderName(model.provider)}
                          </Text>
                          <Text style={styles.modelId}>{model.modelId}</Text>
                        </View>
                      </View>
                      <View style={styles.modelControls}>
                        <Switch
                          value={model.isEnabled}
                          onValueChange={() => handleToggleModel(model.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeModel(model.id)}
                          disabled={modelConfigs.length <= 1}
                        />
                      </View>
                    </View>
                  );
                })()}
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* 新しいモデル追加 */}
        <Card style={styles.addCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={addNewModel}
              icon="plus"
            >
              新しいモデルを追加
            </Button>
          </Card.Content>
        </Card>

        {/* 使用方法 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>使用方法</Title>
            <Paragraph>
              1. 使用したいモデルのスイッチをONにします{'\n'}
              2. 各モデルのAPIキーを設定します{'\n'}
              3. チャット画面でメッセージを送信すると、有効な全てのモデルから回答が返されます{'\n'}
              4. 各回答には、どのモデルからの回答かが表示されます
            </Paragraph>
          </Card.Content>
        </Card>

        {/* 注意事項 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>注意事項</Title>
            <Paragraph>
              • 複数のモデルを同時に使用すると、APIコストが増加します{'\n'}
              • 各モデルのAPIキーは安全に保存されます{'\n'}
              • モデルの回答速度は、各プロバイダーの性能に依存します
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  modelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modelCard: {
    marginVertical: 5,
    width: '23%',
  },
  addCard: {
    marginBottom: 10,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelInfo: {
    flex: 1,
  },
  modelTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  modelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerTag: {
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    marginRight: 8,
  },
  modelId: {
    fontSize: 12,
    color: '#666',
  },
  modelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
  },
  // apiKeySection, apiKeyInput 削除
});

export default SettingsScreen; 