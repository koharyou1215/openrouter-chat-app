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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton, ActivityIndicator, Card, Title, Paragraph } from 'react-native-paper';
import { useChat, Message } from '../contexts/ChatContext';

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { messages, sendMessage, isLoading, customPrompts } = useChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.toggleDrawer() as never}>
          <Text style={styles.headerButtonText}>☰</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Prompts' as never)}
          >
            <Text style={styles.headerButtonText}>📝</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
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

  const activePrompts = customPrompts.filter(p => p.isActive);
  const activePromptsText = activePrompts.length > 0 
    ? `アクティブなプロンプト: ${activePrompts.length}個`
    : 'カスタムプロンプトなし';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* アクティブプロンプト表示 */}
      {activePrompts.length > 0 && (
        <View style={styles.activePromptsContainer}>
          <Text style={styles.activePromptsText}>{activePromptsText}</Text>
        </View>
      )}

      {/* メッセージリスト */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  activePromptsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  activePromptsText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
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
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 22,
    color: 'white',
  },
});

export default ChatScreen; 