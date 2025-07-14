import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelId?: string; // どのモデルからの回答かを識別
}

export interface CustomPrompt {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openrouter' | 'gemini';
  modelId: string;
  isEnabled: boolean;
  apiKey?: string;
}

interface ChatContextType {
  messages: Message[];
  customPrompts: CustomPrompt[];
  modelConfigs: ModelConfig[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  removeMessagesByModelId: (modelId: string) => void;
  addCustomPrompt: (prompt: CustomPrompt) => void;
  updateCustomPrompt: (id: string, prompt: Partial<CustomPrompt>) => void;
  deleteCustomPrompt: (id: string) => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, config: Partial<ModelConfig>) => void;
  deleteModelConfig: (id: string) => void;
  toggleModelConfig: (id: string) => void;
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
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([
    {
      id: 'gpt-4o',
      name: 'GPT-4o (OpenRouter)',
      provider: 'openrouter',
      modelId: 'openai/gpt-4o',
      isEnabled: true,
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'gemini',
      modelId: 'gemini-1.5-pro',
      isEnabled: true,
    },
    {
      id: 'gemini-flash',
      name: 'Gemini Flash',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      isEnabled: false,
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude-3 Sonnet (OpenRouter)',
      provider: 'openrouter',
      modelId: 'anthropic/claude-3-sonnet',
      isEnabled: false,
    },
    {
      id: 'claude-3-opus',
      name: 'Claude-3 Opus (OpenRouter)',
      provider: 'openrouter',
      modelId: 'anthropic/claude-3-opus',
      isEnabled: false,
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet-4 (OpenRouter)',
      provider: 'openrouter',
      modelId: 'anthropic/claude-sonnet-4',
      isEnabled: false,
    },
    {
      id: 'claude-opus-4',
      name: 'Claude Opus-4 (OpenRouter)',
      provider: 'openrouter',
      modelId: 'anthropic/claude-opus-4',
      isEnabled: true,
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat (OpenRouter)',
      provider: 'openrouter',
      modelId: 'deepseek/deepseek-chat-v3-0324',
      isEnabled: true,
    },
    {
      id: 'deepseek-chimera',
      name: 'DeepSeek Chimera (OpenRouter)',
      provider: 'openrouter',
      modelId: 'tngtech/deepseek-r1t2-chimera:free',
      isEnabled: true,
    },
    {
      id: 'grok-4',
      name: 'Grok-4 (OpenRouter)',
      provider: 'openrouter',
      modelId: 'x-ai/grok-4',
      isEnabled: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // データの永続化
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedPrompts = await AsyncStorage.getItem('customPrompts');
      const savedModelConfigs = await AsyncStorage.getItem('modelConfigs');
      const savedMessages = await AsyncStorage.getItem('messages');

      if (savedPrompts) setCustomPrompts(JSON.parse(savedPrompts));
      if (savedModelConfigs) setModelConfigs(JSON.parse(savedModelConfigs));
      if (savedMessages) {
        const parsed: Message[] = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(parsed);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
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

  const saveModelConfigs = async (configs: ModelConfig[]) => {
    try {
      await AsyncStorage.setItem('modelConfigs', JSON.stringify(configs));
      setModelConfigs(configs);
    } catch (error) {
      console.error('モデル設定の保存に失敗しました:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const removeMessagesByModelId = (modelId: string) => {
    setMessages(prev => prev.filter(msg => 
      !(msg.role === 'assistant' && msg.modelId === modelId)
    ));
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

      const enabledModels = modelConfigs.filter(m => m.isEnabled);
      
      if (enabledModels.length === 0) {
        alert('有効なモデルが設定されていません。設定画面でモデルを有効にしてください。');
        return;
      }

      // 各モデルから並行して回答を取得
      const modelPromises = enabledModels.map(async (modelConfig) => {
        try {
          if (modelConfig.provider === 'gemini') {
            // Gemini API を使用
            const geminiApiKey = modelConfig.apiKey?.trim() || (process.env.GEMINI_API_KEY ?? '');

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
            return {
              modelId: modelConfig.id,
              content: data.candidates[0].content.parts[0].text,
            };
          } else {
            // OpenRouter API を使用
            const openRouterApiKey = modelConfig.apiKey?.trim() || (process.env.OPENROUTER_API_KEY ?? '');

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
            return {
              modelId: modelConfig.id,
              content: data.choices[0].message.content,
            };
          }
        } catch (error) {
          console.error(`${modelConfig.name}でのエラー:`, error);
          return {
            modelId: modelConfig.id,
            content: `エラーが発生しました: ${error.message}`,
          };
        }
      });

      // 全てのモデルからの回答を待機
      const responses = await Promise.all(modelPromises);
      
      // 各モデルの回答をメッセージとして追加
      responses.forEach(response => {
        const assistantMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          modelId: response.modelId,
        };
        addMessage(assistantMessage);
      });

    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
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

  const addModelConfig = (config: ModelConfig) => {
    const newConfigs = [...modelConfigs, config];
    saveModelConfigs(newConfigs);
  };

  const updateModelConfig = (id: string, updates: Partial<ModelConfig>) => {
    const newConfigs = modelConfigs.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    saveModelConfigs(newConfigs);
  };

  const deleteModelConfig = (id: string) => {
    const newConfigs = modelConfigs.filter(c => c.id !== id);
    saveModelConfigs(newConfigs);
  };

  const toggleModelConfig = (id: string) => {
    const newConfigs = modelConfigs.map(c => 
      c.id === id ? { ...c, isEnabled: !c.isEnabled } : c
    );
    saveModelConfigs(newConfigs);
  };

  // メッセージが変化したら永続化
  useEffect(() => {
    const saveMessages = async (msgs: Message[]) => {
      try {
        await AsyncStorage.setItem('messages', JSON.stringify(msgs));
      } catch (error) {
        console.error('メッセージの保存に失敗しました:', error);
      }
    };

    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  return (
    <ChatContext.Provider value={{
      messages,
      customPrompts,
      modelConfigs,
      isLoading,
      addMessage,
      sendMessage,
      removeMessagesByModelId,
      addCustomPrompt,
      updateCustomPrompt,
      deleteCustomPrompt,
      addModelConfig,
      updateModelConfig,
      deleteModelConfig,
      toggleModelConfig,
    }}>
      {children}
    </ChatContext.Provider>
  );
}; 