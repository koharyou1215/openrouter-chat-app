import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton, ActivityIndicator, Card, Title, Paragraph, Chip, Appbar, Avatar } from 'react-native-paper';
import { useChat, Message } from '../contexts/ChatContext';

const { width: screenWidth } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { messages, sendMessage, isLoading, customPrompts, modelConfigs, addMessage, removeMessagesByModelId } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollRefs = useRef<{ [key: string]: ScrollView | null }>({});

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
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
      return { icon: 'rocket', color: '#9c27b0' };
    }
    if (modelId.includes('gemini')) {
      return { icon: 'star-four-points', color: '#4285f4' };
    }
    return { icon: 'robot-outline', color: '#666' };
  };

  const getModelName = (modelId: string) => {
    const model = modelConfigs.find(m => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  };

  const renderMessage = (item: Message) => {
    const isUser = item.role === 'user';
    
    return (
      <View key={item.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <Card style={[styles.messageCard, isUser ? styles.userCard : styles.assistantCard]}>
          <Card.Content>
            <Paragraph style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {item.content}
            </Paragraph>
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString()}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  // モデルごとのメッセージをフィルタリング
  const getMessagesForModel = (modelId: string) => {
    return messages.filter(msg => 
      msg.role === 'user' || msg.modelId === modelId
    );
  };

  // 分割ビューのレンダリング
  const renderModelPanel = (modelConfig: any) => {
    const modelMessages = getMessagesForModel(modelConfig.id);
    const { icon, color } = getModelBrand(modelConfig.id);
    const latestResponse = modelMessages.filter(msg => msg.role === 'assistant').pop();
    
    return (
      <View key={modelConfig.id} style={styles.modelPanel}>
        <View style={styles.modelPanelHeader}>
          <View style={styles.modelPanelTitleContainer}>
            <Avatar.Icon
              icon={icon}
              size={20}
              style={{ backgroundColor: color, marginRight: 6 }}
              color="white"
            />
            <Text style={styles.modelPanelTitle}>{modelConfig.name}</Text>
          </View>
          
          {/* アクションボタン */}
          <View style={styles.modelPanelActions}>
            {latestResponse && (
              <>
                <IconButton
                  icon="volume-high"
                  size={16}
                  onPress={() => handleVoicePlay(latestResponse.content)}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="refresh"
                  size={16}
                  onPress={() => handleRegenerate(modelConfig.id)}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="content-copy"
                  size={16}
                  onPress={() => handleCopy(latestResponse.content)}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </View>
        <ScrollView
          ref={(ref) => (scrollRefs.current[modelConfig.id] = ref)}
          style={styles.modelPanelMessages}
          onContentSizeChange={() => scrollRefs.current[modelConfig.id]?.scrollToEnd()}
        >
          {modelMessages.map(renderMessage)}
        </ScrollView>
      </View>
    );
  };

  // 音声読み上げ機能
  const handleVoicePlay = async (text: string) => {
    try {
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsApiKey) {
        Alert.alert('エラー', '11Labs APIキーが設定されていません');
        return;
      }

      // 長いテキストの場合は最初の500文字のみ使用
      const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
      
      // 11Labs APIで音声合成
      const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam (English)
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`11Labs API エラー: ${response.status}`);
      }

      // 音声データを取得
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Web Audio API で再生
      const audio = new Audio(audioUrl);
      audio.play();
      
      Alert.alert('音声再生', '音声を再生しています...');
      
      // 再生完了後にURLを解放
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
    } catch (error) {
      console.error('音声再生エラー:', error);
      Alert.alert('エラー', '音声再生に失敗しました');
    }
  };

  // 再生成機能
  const handleRegenerate = async (modelId: string) => {
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    if (!lastUserMessage) {
      Alert.alert('エラー', '再生成する元のメッセージがありません');
      return;
    }

    try {
      // 該当モデルの最新回答を削除
      removeMessagesByModelId(modelId);
      
      // 該当モデルの設定を取得
      const modelConfig = modelConfigs.find(m => m.id === modelId);
      if (!modelConfig) {
        Alert.alert('エラー', 'モデル設定が見つかりません');
        return;
      }
      
      // 個別の再生成では全体のローディング状態は使用しない
      
      // アクティブなプロンプトを取得
      const activePrompts = customPrompts.filter(p => p.isActive);
      const systemPrompt = activePrompts.length > 0 
        ? activePrompts.map(p => p.content).join('\n\n')
        : 'あなたは役立つアシスタントです。';
      
      // 単一モデルで再生成
      try {
        let responseContent = '';
        
        if (modelConfig.provider === 'gemini') {
          const geminiApiKey = modelConfig.apiKey?.trim() || process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
            throw new Error('Gemini APIキーが設定されていません');
          }
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.modelId}:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${lastUserMessage.content}` }]
                }
              ],
              generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
              },
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Gemini APIエラー: ${response.status}`);
          }
          
          const data = await response.json();
          responseContent = data.candidates[0].content.parts[0].text;
          
        } else {
          const openRouterApiKey = modelConfig.apiKey?.trim() || process.env.OPENROUTER_API_KEY;
          if (!openRouterApiKey) {
            throw new Error('OpenRouter APIキーが設定されていません');
          }
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': 'https://openrouter-chat-app.com',
              'X-Title': 'OpenRouter Chat App',
            },
            body: JSON.stringify({
              model: modelConfig.modelId,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: lastUserMessage.content }
              ],
              max_tokens: 1000,
              temperature: 0.7,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`OpenRouter APIエラー: ${response.status}`);
          }
          
          const data = await response.json();
          responseContent = data.choices[0].message.content;
        }
        
        // 新しい回答を追加
        const newResponse: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          modelId: modelConfig.id,
        };
        
        addMessage(newResponse);
        
      } catch (error) {
        console.error(`${modelConfig.name}での再生成エラー:`, error);
        Alert.alert('エラー', `${modelConfig.name}での再生成に失敗しました: ${error.message}`);
      }
      
    } catch (error) {
      console.error('再生成エラー:', error);
      Alert.alert('エラー', '再生成に失敗しました');
    } finally {
      // isLoadingはuseChat内で管理されているため、ここでは操作しない
    }
  };

  // コピー機能
  const handleCopy = async (text: string) => {
    try {
      // Web環境でのクリップボードAPI使用
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        Alert.alert('コピー完了', 'テキストをクリップボードにコピーしました');
      } else {
        // フォールバック: テキストを選択状態にする
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Alert.alert('コピー完了', 'テキストをクリップボードにコピーしました');
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert('エラー', 'コピーに失敗しました');
    }
  };

  const activePrompts = customPrompts.filter(p => p.isActive);
  const enabledModels = modelConfigs.filter(m => m.isEnabled);
  const activePromptsText = activePrompts.length > 0 
    ? `アクティブなプロンプト: ${activePrompts.length}個`
    : 'カスタムプロンプトなし';
  const enabledModelsText = `有効なモデル: ${enabledModels.length}個`;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="OpenRouter Chat" />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings' as never)} />
        <Appbar.Action icon="note-text" onPress={() => navigation.navigate('Prompts' as never)} />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* アクティブプロンプトとモデル情報表示 */}
        {(activePrompts.length > 0 || enabledModels.length > 0) && (
          <View style={styles.infoContainer}>
            {activePrompts.length > 0 && (
              <Text style={styles.infoText}>{activePromptsText}</Text>
            )}
            <Text style={styles.infoText}>{enabledModelsText}</Text>
          </View>
        )}

        {/* 分割ビュー */}
        <View style={styles.splitView}>
          {enabledModels.map(renderModelPanel)}
        </View>

        {/* 入力エリア */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <IconButton icon="send" iconColor="white" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
    marginVertical: 2,
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  modelPanel: {
    width: screenWidth > 768 ? '48%' : '100%',
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modelPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  modelPanelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelPanelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
    padding: 4,
  },
  modelPanelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  modelPanelMessages: {
    flex: 1,
    padding: 10,
    maxHeight: 400,
  },
  messageContainer: {
    marginVertical: 5,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    elevation: 2,
  },
  userCard: {
    backgroundColor: '#6200ee',
  },
  assistantCard: {
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6200ee',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen; 