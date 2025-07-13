import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Switch, IconButton, FAB } from 'react-native-paper';
import { useChat, CustomPrompt } from '../contexts/ChatContext';

const PromptsScreen: React.FC = () => {
  const { customPrompts, addCustomPrompt, updateCustomPrompt, deleteCustomPrompt } = useChat();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    isActive: true,
  });

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
        <Paragraph style={styles.promptContent}>{item.content}</Paragraph>
        <Text style={styles.promptStatus}>
          ステータス: {item.isActive ? 'アクティブ' : '非アクティブ'}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
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
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="プロンプトの名前"
                  mode="outlined"
                />
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
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#6200ee',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default PromptsScreen; 