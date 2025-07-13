import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CustomPrompt {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

interface ChatContextType {
  messages: Message[];
  customPrompts: CustomPrompt[];
  apiKey: string;
  selectedModel: string;
  isLoading: boolean;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  addCustomPrompt: (prompt: CustomPrompt) => void;
  updateCustomPrompt: (id: string, prompt: Partial<CustomPrompt>) => void;
  deleteCustomPrompt: (id: string) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [selectedModel, setSelectedModelState] = useState<string>('openai/gpt-4');
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>('AIzaSyB6swTTIlDM3pgyALHjZDFTUIQf2fhzLAE');
  const [isLoading, setIsLoading] = useState(false);

  // データの永続化
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem('apiKey');
      const savedModel = await AsyncStorage.getItem('selectedModel');
      const savedPrompts = await AsyncStorage.getItem('customPrompts');
      
      if (savedApiKey) setApiKeyState(savedApiKey);
      if (savedModel) setSelectedModelState(savedModel);
      if (savedPrompts) setCustomPrompts(JSON.parse(savedPrompts));
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  };

  const saveApiKey = async (key: string) => {
    try {
      await AsyncStorage.setItem('apiKey', key);
      setApiKeyState(key);
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
    }
  };

  const saveSelectedModel = async (model: string) => {
    try {
      await AsyncStorage.setItem('selectedModel', model);
      setSelectedModelState(model);
    } catch (error) {
      console.error('モデルの保存に失敗しました:', error);
    }
  };

  const saveCustomPrompts = async (prompts: CustomPrompt[]) => {
    try {
      await AsyncStorage.setItem('customPrompts', JSON.stringify(prompts));
      setCustomPrompts(prompts);
    } catch (error) {
      console.error('プロンプトの保存に失敗しました:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      const activePrompts = customPrompts.filter(p => p.isActive);
      const systemPrompt = activePrompts.length > 0 
        ? activePrompts.map(p => p.content).join('\n\n')
        : 'あなたは役立つアシスタントです。';

      // モデルタイプを判定
      const isGeminiModel = selectedModel.startsWith('google/gemini');
      
      if (isGeminiModel) {
        // Gemini API を使用
        if (!geminiApiKey) {
          alert('Gemini APIキーを設定してください');
          return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${content}` }]
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
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date(),
        };

        addMessage(assistantMessage);
      } else {
        // OpenRouter API を使用
        if (!apiKey) {
          alert('OpenRouter APIキーを設定してください');
          return;
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://openrouter-chat-app.com',
            'X-Title': 'OpenRouter Chat App',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter APIエラー: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: new Date(),
        };

        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error('メッセージの送信に失敗しました:', error);
      alert('メッセージの送信に失敗しました。APIキーとモデルを確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomPrompt = (prompt: CustomPrompt) => {
    const newPrompts = [...customPrompts, prompt];
    saveCustomPrompts(newPrompts);
  };

  const updateCustomPrompt = (id: string, updates: Partial<CustomPrompt>) => {
    const newPrompts = customPrompts.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    saveCustomPrompts(newPrompts);
  };

  const deleteCustomPrompt = (id: string) => {
    const newPrompts = customPrompts.filter(p => p.id !== id);
    saveCustomPrompts(newPrompts);
  };

  const setApiKey = (key: string) => {
    saveApiKey(key);
  };

  const setSelectedModel = (model: string) => {
    saveSelectedModel(model);
  };

  const value: ChatContextType = {
    messages,
    customPrompts,
    apiKey,
    selectedModel,
    isLoading,
    addMessage,
    sendMessage,
    addCustomPrompt,
    updateCustomPrompt,
    deleteCustomPrompt,
    setApiKey,
    setSelectedModel,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 