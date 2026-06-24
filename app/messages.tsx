import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt?: any;
}

interface ConversationSummary {
  chatId: string;
  targetUserId: string;
  lastMessageText: string;
  createdAt: any;
}

export default function MessageDashboardScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [userNamesMap, setUserNamesMap] = useState<{ [uid: string]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(auth.currentUser?.uid || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    console.log("📨 Dashboard merging chat IDs cleanly for UID:", currentUserId);

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const latestMessageMap: { [normalizedChatId: string]: ChatMessage } = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const senderId = data.senderId || "";
          const receiverId = data.receiverId || "";
          
          // 1. CRITICAL STANDARDIZATION STEP
          // Always calculate a clean, sorted room signature using both participant IDs.
          // This forces 'UserA_UserB' and 'UserB_UserA' to combine into the exact same list item row!
          if (senderId && receiverId && (senderId === currentUserId || receiverId === currentUserId)) {
            const normalizedChatId = [senderId, receiverId].sort().join('_');

            // Because our query is sorted by 'desc', the first message we find for this 
            // combined thread is guaranteed to be the most recent one across both users.
            if (!latestMessageMap[normalizedChatId]) {
              latestMessageMap[normalizedChatId] = {
                id: doc.id,
                chatId: data.chatId || normalizedChatId,
                senderId,
                receiverId,
                text: data.text || "",
                createdAt: data.createdAt
              };
            }
          }
        });

        // 2. Map grouped results into single unified structures
        const summaryList: ConversationSummary[] = Object.keys(latestMessageMap).map((normalizedId) => {
          const lastMsg = latestMessageMap[normalizedId];
          
          // Isolate the target recipient's UID cleanly
          const parts = normalizedId.split("_");
          const targetUserId = parts[0] === currentUserId ? parts[1] : parts[0];

          return {
            chatId: lastMsg.chatId, // Passes the actual working ID parameter used for routing
            targetUserId: targetUserId || "unknown_user",
            lastMessageText: lastMsg.text,
            createdAt: lastMsg.createdAt
          };
        });

        setConversations(summaryList);
      },
      (error) => {
        console.error("❌ Flat collection summary feed broken:", error);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUserId]);

  // Handle matching profile names dynamically
  useEffect(() => {
    const fetchMissingProfileNames = async () => {
      const updatedMap = { ...userNamesMap };
      let changed = false;

      for (const conv of conversations) {
        const uid = conv.targetUserId;
        if (uid && uid !== "unknown_user" && !updatedMap[uid]) {
          try {
            const userDocRef = doc(db, "users", uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              updatedMap[uid] = userDocSnap.data().name || userDocSnap.data().displayName || "JobConnect User";
            } else {
              updatedMap[uid] = `User (${uid.substring(0, 5)})`;
            }
            changed = true;
          } catch (err) {
            updatedMap[uid] = `User (${uid.substring(0, 5)})`;
            changed = true;
          }
        }
      }

      if (changed) {
        setUserNamesMap(updatedMap);
      }
    };

    if (conversations.length > 0) {
      fetchMissingProfileNames();
    }
  }, [conversations]);

 const handleRoomPress = (item: ConversationSummary) => {
router.push({
  pathname: "/chat/[chatId]",
  params: {
    chatId: item.chatId,
    receiverId: item.targetUserId
  }
});
};

  const renderItem = ({ item }: { item: ConversationSummary }) => {
    const rawUidString = item.targetUserId || "unknown";
    const shortenedBackupId = rawUidString.length > 5 ? rawUidString.substring(0, 6) : rawUidString;
    const displayName = userNamesMap[rawUidString] || `User (${shortenedBackupId}...)`;

    return (
      <Pressable style={styles.roomRow} onPress={() => handleRoomPress(item)}>
        <View style={styles.fallbackAvatar}>
          <Text style={styles.fallbackAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.previewSnippet} numberOfLines={1}>
            {item.lastMessageText || ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00a884" />
        <Text style={styles.infoText}>Loading chat history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.chatId}
        renderItem={renderItem}
        contentContainerStyle={conversations.length === 0 ? styles.flexGrow : undefined}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No conversation history found.</Text>
            <Text style={styles.subEmptyText}>When you send or receive a message, it will show up here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#ffffff' } as ViewStyle,
  flexGrow: { flexGrow: 1 } as ViewStyle,
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 } as ViewStyle,
  roomRow: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' } as ViewStyle,
  fallbackAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  fallbackAvatarText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' } as TextStyle,
  metaContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' } as ViewStyle,
  profileName: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 } as TextStyle,
  previewSnippet: { fontSize: 14, color: '#666666' } as TextStyle,
  infoText: { color: '#666666', fontSize: 14, marginTop: 10 } as TextStyle,
  emptyText: { color: '#888888', fontSize: 16, fontWeight: '600', textAlign: 'center' } as TextStyle,
  subEmptyText: { color: '#aaaaaa', fontSize: 12, marginTop: 6, textAlign: 'center' } as TextStyle
};
