import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Switch, IconButton, FAB, Appbar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useChat, CustomPrompt } from '../contexts/ChatContext';

const PromptsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { customPrompts, addCustomPrompt, updateCustomPrompt, deleteCustomPrompt } = useChat();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    isActive: true,
  });
  const [suggestions, setSuggestions] = useState<Array<{title: string, content: string}>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // プロンプト候補の辞書
  const promptTemplates = {
    '翻訳': [
      { title: '自然な日本語翻訳', content: 'あなたは優秀な翻訳者です。以下の文章を自然で読みやすい日本語に翻訳してください。直訳ではなく、日本語として自然な表現を心がけてください。' },
      { title: '正確な直訳', content: 'あなたは正確な翻訳者です。以下の文章を原文の意味を正確に保ちながら日本語に翻訳してください。文の構造や表現を可能な限り原文に忠実に翻訳してください。' },
      { title: 'ビジネス翻訳', content: 'あなたはビジネス文書の翻訳専門家です。以下の文章をビジネスシーンに適した丁寧で正確な日本語に翻訳してください。敬語や専門用語の使用に注意してください。' }
    ],
    '要約': [
      { title: '簡潔な要約', content: 'あなたは要約の専門家です。以下の文章を3つの要点にまとめて、簡潔で分かりやすい日本語で要約してください。' },
      { title: '詳細な要約', content: 'あなたは文章分析の専門家です。以下の文章の主要なポイントを整理し、構造化された詳細な要約を作成してください。' },
      { title: '箇条書き要約', content: 'あなたは情報整理の専門家です。以下の文章を読んで、重要なポイントを箇条書きで整理してください。' }
    ],
    'コード': [
      { title: 'コードレビュー', content: 'あなたは経験豊富なソフトウェアエンジニアです。以下のコードをレビューし、改善点、バグの可能性、ベストプラクティスの観点からフィードバックを提供してください。' },
      { title: 'コード説明', content: 'あなたはプログラミング講師です。以下のコードを初心者にも分かりやすく説明してください。各行の役割と全体の動作を詳しく解説してください。' },
      { title: 'リファクタリング', content: 'あなたはコード品質の専門家です。以下のコードをより読みやすく、保守しやすく、効率的にリファクタリングしてください。変更理由も説明してください。' }
    ],
    '文章': [
      { title: '文章校正', content: 'あなたは文章校正の専門家です。以下の文章の誤字脱字、文法の間違い、表現の改善点を指摘し、より良い文章に修正してください。' },
      { title: '文章添削', content: 'あなたは文章指導の専門家です。以下の文章を読んで、構成、論理性、表現力の観点から詳細な添削とアドバイスを提供してください。' },
      { title: '文体変換', content: 'あなたは文章スタイルの専門家です。以下の文章を指定された文体（丁寧語、カジュアル、学術的など）に変換してください。' }
    ]
  };

  // 名前入力時の候補生成
  const generateSuggestions = (name: string) => {
    if (!name.trim()) {
      setSuggestions([]);
      return;
    }

    // ローカル辞書から候補を検索
    const localSuggestions: Array<{title: string, content: string}> = [];
    Object.keys(promptTemplates).forEach(key => {
      if (key.includes(name) || name.includes(key)) {
        localSuggestions.push(...promptTemplates[key as keyof typeof promptTemplates]);
      }
    });

    if (localSuggestions.length > 0) {
      setSuggestions(localSuggestions.slice(0, 5));
    } else {
      // LLMによる動的生成（GPT-4o, Claude-Opus-4, Grok-4を使用）
      generateAISuggestions(name);
    }
  };

  // AI による候補生成
  const generateAISuggestions = async (name: string) => {
    setIsLoadingSuggestions(true);
    try {
      const systemPrompt = `あなたはプロンプトエンジニアリングの専門家です。「${name}」というタイトルに基づいて、効果的なプロンプトを3つ提案してください。各プロンプトは具体的で実用的で、AIが理解しやすい形式にしてください。

出力形式：
1. [プロンプトタイトル1]: [プロンプト内容1]
2. [プロンプトタイトル2]: [プロンプト内容2]
3. [プロンプトタイトル3]: [プロンプト内容3]`;

      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
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
          model: 'openai/gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `「${name}」に関するプロンプトを提案してください。` }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // レスポンスをパース
      const parsedSuggestions = parseAISuggestions(content);
      setSuggestions(parsedSuggestions);

    } catch (error) {
      console.error('AI候補生成エラー:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // AI レスポンスのパース
  const parseAISuggestions = (content: string): Array<{title: string, content: string}> => {
    const suggestions: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^\d+\.\s*\[([^\]]+)\]:\s*(.+)$/);
      if (match) {
        suggestions.push({
          title: match[1].trim(),
          content: match[2].trim()
        });
      }
    });
    
    return suggestions;
  };

  // 候補選択時の処理
  const selectSuggestion = (suggestion: {title: string, content: string}) => {
    setFormData({
      ...formData,
      content: suggestion.content
    });
    setSuggestions([]);
  };

  const handleAddPrompt = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      Alert.alert('エラー', '名前と内容を入力してください');
      return;
    }

    const newPrompt: CustomPrompt = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      content: formData.content.trim(),
      isActive: formData.isActive,
    };

    addCustomPrompt(newPrompt);
    setFormData({ name: '', content: '', isActive: true });
    setSuggestions([]);
    setShowAddForm(false);
    Alert.alert('成功', 'プロンプトを追加しました');
  };

  const handleEditPrompt = (prompt: CustomPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      content: prompt.content,
      isActive: prompt.isActive,
    });
    setSuggestions([]);
    setShowAddForm(true);
  };

  const handleUpdatePrompt = () => {
    if (!editingPrompt || !formData.name.trim() || !formData.content.trim()) {
      Alert.alert('エラー', '名前と内容を入力してください');
      return;
    }

    updateCustomPrompt(editingPrompt.id, {
      name: formData.name.trim(),
      content: formData.content.trim(),
      isActive: formData.isActive,
    });

    setFormData({ name: '', content: '', isActive: true });
    setSuggestions([]);
    setEditingPrompt(null);
    setShowAddForm(false);
    Alert.alert('成功', 'プロンプトを更新しました');
  };

  const handleDeletePrompt = (prompt: CustomPrompt) => {
    Alert.alert(
      '削除確認',
      `「${prompt.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deleteCustomPrompt(prompt.id);
            Alert.alert('成功', 'プロンプトを削除しました');
          },
        },
      ]
    );
  };

  const handleToggleActive = (prompt: CustomPrompt) => {
    updateCustomPrompt(prompt.id, { isActive: !prompt.isActive });
  };

  const renderPrompt = ({ item }: { item: CustomPrompt }) => (
    <Card style={styles.promptCard}>
      <Card.Content>
        <View style={styles.promptHeader}>
          <Title style={styles.promptTitle}>{item.name}</Title>
          <View style={styles.promptActions}>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleActive(item)}
            />
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditPrompt(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeletePrompt(item)}
            />
          </View>
        </View>
        <Paragraph style={styles.promptContent}>
          {item.content.split('\n')[0]}
          {item.content.includes('\n') && '...'}
        </Paragraph>
        <Text style={styles.promptStatus}>
          ステータス: {item.isActive ? 'アクティブ' : '非アクティブ'}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="カスタムプロンプト" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {customPrompts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>カスタムプロンプトがありません</Title>
              <Paragraph>
                カスタムプロンプトを追加して、AIの応答をカスタマイズしましょう。
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={customPrompts}
            renderItem={renderPrompt}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        {showAddForm && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Title>{editingPrompt ? 'プロンプトを編集' : '新しいプロンプト'}</Title>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>名前</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    generateSuggestions(text);
                  }}
                  placeholder="プロンプトの名前"
                  mode="outlined"
                />
                
                {/* 候補表示 */}
                {(suggestions.length > 0 || isLoadingSuggestions) && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>おすすめ候補:</Text>
                    {isLoadingSuggestions ? (
                      <Text style={styles.loadingText}>候補を生成中...</Text>
                    ) : (
                      <View style={styles.suggestionsChips}>
                        {suggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            mode="outlined"
                            onPress={() => selectSuggestion(suggestion)}
                            style={styles.suggestionChip}
                          >
                            {suggestion.title}
                          </Chip>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>内容</Text>
                <TextInput
                  style={styles.textArea}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder="プロンプトの内容を入力..."
                  multiline
                  numberOfLines={4}
                  mode="outlined"
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>アクティブにする</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowAddForm(false);
                    setEditingPrompt(null);
                    setFormData({ name: '', content: '', isActive: true });
                    setSuggestions([]);
                  }}
                  style={styles.cancelButton}
                >
                  キャンセル
                </Button>
                <Button
                  mode="contained"
                  onPress={editingPrompt ? handleUpdatePrompt : handleAddPrompt}
                  style={styles.saveButton}
                >
                  {editingPrompt ? '更新' : '追加'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {!showAddForm && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setShowAddForm(true)}
        />
      )}
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
  emptyCard: {
    marginVertical: 20,
  },
  promptCard: {
    marginBottom: 10,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  promptTitle: {
    flex: 1,
  },
  promptActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptContent: {
    marginBottom: 10,
    fontSize: 14,
  },
  promptStatus: {
    fontSize: 12,
    color: '#666',
  },
  formCard: {
    marginTop: 10,
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
  textArea: {
    marginBottom: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  suggestionsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  suggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    marginBottom: 5,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PromptsScreen; 