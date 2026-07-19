import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Platform } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { deleteChat, getChatHistory } from '../utils/chatHistory';

export default function DrawerMenuScreen() {
  const router = useRouter();
  const [recentChats, setRecentChats] = useState([]);

  useFocusEffect(useCallback(() => {
    getChatHistory().then(setRecentChats);
  }, []));

  const confirmDeleteChat = (chat) => {
    Alert.alert(
      'Delete chat?',
      `Delete "${chat.title}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chat.id);
              setRecentChats((chats) => chats.filter((item) => item.id !== chat.id));
            } catch {
              Alert.alert('Unable to delete', 'Please try again.');
            }
          },
        },
      ]
    );
  };

 

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Top Close Button ('X') */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton}   onPress={() => router.back()} >
          <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Logo Area */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={[styles.logoText, {color: '#1A365D'}]}>EASY </Text>
          <Text style={[styles.logoText, {color: '#48BB78'}]}>Eco</Text>
        </Text>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity style={styles.newChatButton}
      onPress={() => router.replace({ pathname: '/(main)/robot', params: { newChat: Date.now().toString() } })}
      >
        {/* Chat bubble Icon (Svg) */}
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={styles.chatIcon}>
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
        <Text style={styles.newChatText}>New chat</Text>
      </TouchableOpacity>

      {/* Recents Section */}
      <Text style={styles.recentsHeader}>Recents</Text>

      <FlatList
        data={recentChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recentItem}
            onPress={() => router.replace({ pathname: '/(main)/robot', params: { chatId: item.id } })}
            onLongPress={() => confirmDeleteChat(item)}
            delayLongPress={450}
          >
            <Text style={styles.recentItemText} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No chat history yet.</Text>}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 60,
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  closeButton: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  newChatButton: {
    flexDirection: 'row',
    backgroundColor: '#1A56DB', // Deep Blue
    alignItems: 'center',
    alignSelf: 'flex-start', // Fit to content
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 35,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  chatIcon: {
    marginRight: 10,
  },
  newChatText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recentsHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  recentItem: {
    backgroundColor: '#E5E7EB', // Light Gray background
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  recentItemText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyText: { color: '#6B7280', fontSize: 15, textAlign: 'center', marginTop: 24 },
});
